// Placeholder for Google APIs (Docs, Sheets, Slides, Drive).
// Wire up with googleapis package and service account credentials before using in production.

import type { Account } from "@prisma/client";

import { db } from "./db";

interface ExportPayload {
  tradeStudyId?: string;
  payload?: unknown;
}

export async function exportToDocs({ tradeStudyId, payload }: ExportPayload) {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    return { status: "skipped", reason: "GOOGLE_SERVICE_ACCOUNT_KEY missing" };
  }

  // TODO: Use googleapis Docs API to create or update a document in the provided Drive folder.
  return {
    status: "ok",
    message: `Stubbed export for trade study ${tradeStudyId ?? "(unknown)"}`,
    payload
  };
}

export async function exportToSheets({ tradeStudyId }: ExportPayload) {
  return { status: "ok", message: `Stubbed Sheets export for ${tradeStudyId ?? "unknown"}` };
}

export async function exportToSlides({ tradeStudyId }: ExportPayload) {
  return { status: "ok", message: `Stubbed Slides export for ${tradeStudyId ?? "unknown"}` };
}

export async function uploadToDrive({ tradeStudyId }: ExportPayload) {
  const folder = process.env.GOOGLE_DRIVE_FOLDER_ID || "unset";
  return { status: "ok", message: `Stubbed Drive upload for ${tradeStudyId ?? "unknown"} to folder ${folder}` };
}

export function getGoogleAuthUrl(callbackUrl = "/dashboard") {
  // Redirects through NextAuth so tokens are saved via the Prisma adapter.
  return `/auth/google?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

export type GoogleDriveFile = {
  id: string;
  name: string;
  mimeType: string;
};

export type DriveListing = {
  files: GoogleDriveFile[];
  requiresLink: boolean;
  account?: Pick<Account, "id" | "scope" | "refresh_token" | "expires_at"> | null;
};

export async function getLinkedGoogleAccount(userId?: string) {
  if (!process.env.DATABASE_URL || !userId) return null;
  try {
    return await db.account.findFirst({ where: { userId, provider: "google" } });
  } catch (err) {
    console.error("[getLinkedGoogleAccount] failed", err);
    return null;
  }
}

export async function listDriveFiles(userId?: string): Promise<DriveListing> {
  const account = await getLinkedGoogleAccount(userId);
  const requiresLink = !account;

  // TODO: Replace with live Drive API call using the oauth tokens in the Account table.
  return {
    requiresLink,
    account: account
      ? {
          id: account.id,
          scope: account.scope,
          refresh_token: account.refresh_token,
          expires_at: account.expires_at
        }
      : null,
    files: [
      { id: "1-demo-doc", name: "Trade study doc (stub)", mimeType: "application/vnd.google-apps.document" },
      { id: "1-demo-sheet", name: "Option scoring sheet (stub)", mimeType: "application/vnd.google-apps.spreadsheet" },
      { id: "1-demo-slide", name: "Review slides (stub)", mimeType: "application/vnd.google-apps.presentation" }
    ]
  };
}
