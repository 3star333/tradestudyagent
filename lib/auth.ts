import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions, Session } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { db } from "./db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
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
    strategy: "database"
  },
  callbacks: {
    session: async ({ session, user }): Promise<Session> => {
      if (session?.user) {
        session.user.id = user.id;
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
    }
  }
};

export function getCurrentUser() {
  return getServerSession(authOptions);
}
