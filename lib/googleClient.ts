// Dynamic import to avoid build-time type resolution failure if googleapis types missing.
// Falls back gracefully when dependency not installed.
let googleLib: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  googleLib = require("googleapis");
} catch {
  googleLib = null;
}
import { db } from "./db";

interface OAuthTokens {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
}

export async function getUserGoogleOAuthClient(userId: string) {
  const account = await db.account.findFirst({ where: { userId, provider: "google" } });
  if (!account) throw new Error("Google account not linked");

  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const redirectUri = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || "http://localhost:3000";

  if (!googleLib) throw new Error("googleapis library not available");
  const oauth2Client = new googleLib.google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials({
    access_token: account.access_token || undefined,
    refresh_token: account.refresh_token || undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined
  });

  // Refresh if expiring within 2 minutes
  const needsRefresh = shouldRefresh(oauth2Client.credentials);
  if (needsRefresh) {
    try {
      const refreshed = await oauth2Client.refreshAccessToken();
      const tokens = refreshed.credentials;
      await persistUpdatedTokens(account.id, tokens);
      oauth2Client.setCredentials(tokens);
    } catch (e) {
      console.warn("[googleClient] token refresh failed", e);
    }
  }

  return oauth2Client;
}

function shouldRefresh(tokens: OAuthTokens) {
  if (!tokens.access_token) return true;
  if (!tokens.expiry_date) return false;
  const now = Date.now();
  return tokens.expiry_date - now < 2 * 60 * 1000; // < 2 minutes
}

async function persistUpdatedTokens(accountId: string, tokens: OAuthTokens) {
  try {
    await db.account.update({
      where: { id: accountId },
      data: {
        access_token: tokens.access_token || null,
        refresh_token: tokens.refresh_token || undefined,
        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
        scope: undefined
      }
    });
  } catch (e) {
    console.error("[googleClient] failed updating tokens", e);
  }
}

export async function getDriveClient(userId: string) {
  if (!googleLib) throw new Error("googleapis library not available");
  const auth = await getUserGoogleOAuthClient(userId);
  return googleLib.google.drive({ version: "v3", auth });
}

export async function getDocsClient(userId: string) {
  if (!googleLib) throw new Error("googleapis library not available");
  const auth = await getUserGoogleOAuthClient(userId);
  return googleLib.google.docs({ version: "v1", auth });
}

export async function getSheetsClient(userId: string) {
  if (!googleLib) throw new Error("googleapis library not available");
  const auth = await getUserGoogleOAuthClient(userId);
  return googleLib.google.sheets({ version: "v4", auth });
}
