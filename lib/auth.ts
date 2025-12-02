import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions, Session } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { db } from "./db";

// Wrap adapter to strip unsupported provider fields
function SanitizedPrismaAdapter() {
  const base = PrismaAdapter(db);
  return {
    ...base,
  async linkAccount(account: any) {
      // Remove field prisma may not support yet
      if ("refresh_token_expires_in" in account) {
        delete (account as any).refresh_token_expires_in;
      }
      return base.linkAccount(account);
    }
  } as typeof base;
}

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === "development", // Enable debug logs in development
  adapter: SanitizedPrismaAdapter(),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true, // Allow linking accounts with same email
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/drive",
            "https://www.googleapis.com/auth/documents",
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/presentations.readonly"
          ].join(" ")
        }
      }
    })
  ],
  pages: {
    signIn: "/login"
  },
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      if (account?.provider === "google") {
        token.googleLinked = true;
      }
      return token;
    },
    async signIn({ user, account, profile }) {
      console.log("[signIn callback] user=", user?.id, "email=", user?.email, "provider=", account?.provider);
      if (!user.email) {
        console.warn("[signIn callback] Rejecting login: missing email");
        return false;
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl + "/dashboard";
    },
    session: async ({ session, token }): Promise<Session> => {
      if (session.user) {
        session.user.id = (token.id as string) || session.user.id;
        (session.user as any).googleLinked = Boolean(token.googleLinked);
      }
      return session;
    }
  },
  events: {
    async linkAccount({ user, account }) {
      if (!account?.refresh_token) return;
      // Persist latest refresh token to keep Google linkage fresh.
      await db.account.update({
        where: { provider_providerAccountId: { provider: account.provider, providerAccountId: account.providerAccountId } },
        data: {
          refresh_token: account.refresh_token,
          access_token: account.access_token,
          expires_at: account.expires_at ?? undefined,
          scope: account.scope ?? undefined,
          token_type: account.token_type ?? undefined,
          id_token: account.id_token ?? undefined
        }
      });
      console.log("[linkAccount event] Updated tokens for user", user.id, "provider", account.provider);
    }
  }
};

export function getCurrentUser() {
  return getServerSession(authOptions);
}
