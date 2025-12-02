// Placeholder for Google APIs (Docs, Sheets, Slides, Drive).
// Wire up with googleapis package and service account credentials before using in production.

import type { Account } from "@prisma/client";
import { db } from "./db";
import { getDriveClient, getDocsClient, getSheetsClient } from "./googleClient";
import OpenAI from "openai";

interface ExportPayload {
  tradeStudyId?: string;
  payload?: unknown;
}

export async function exportToDocs({ tradeStudyId, payload, userId, folderId }: ExportPayload & { userId?: string; folderId?: string }) {
  if (!payload || !tradeStudyId) return { status: "error", artifact: "doc", message: "Missing payload or tradeStudyId" };
  if (!payload || typeof payload !== "object") return { status: "error", artifact: "doc", message: "Invalid payload" };
  try {
    if (!userId) return { status: "skipped", artifact: "doc", message: "No userId provided" };
    const drive = await getDriveClient(userId);
    const docs = await getDocsClient(userId);
    const title = (payload as any).title || (payload as any).topic || `Trade Study ${tradeStudyId}`;
    // Create doc (empty)
    const fileMeta: any = await drive.files.create({
      requestBody: {
        name: title,
        mimeType: "application/vnd.google-apps.document",
        parents: folderId ? [folderId] : undefined
      }
    });
    const fileId = fileMeta.data.id;
    if (!fileId) return { status: "error", artifact: "doc", message: "Failed to create document" };

    const sections = (payload as any).criteria ? await buildDocSectionsWithNarrative(payload as any) : [];
    if (sections.length === 0) {
      return { status: "ok", artifact: "doc", fileId, message: "Doc created (no sections)" };
    }

    // Build a single insert request using endOfSegmentLocation to append
    const fullText = sections
      .map((s: any) => `# ${s.heading}\n${s.body}`)
      .join("\n\n");

    await docs.documents.batchUpdate({
      documentId: fileId,
      requestBody: {
        requests: [
          {
            insertText: {
              endOfSegmentLocation: {},
              text: fullText + "\n"
            }
          }
        ]
      }
    });
    console.log(`[exportToDocs] Populated doc ${fileId} (${title})`);
    return { status: "ok", artifact: "doc", fileId, message: "Doc populated" };
  } catch (e) {
    console.error("[exportToDocs] error", e);
    return { status: "error", artifact: "doc", message: e instanceof Error ? e.message : String(e) };
  }
}

async function buildDocSectionsWithNarrative(payload: any) {
  const { topic, criteria = [], alternatives = [], scored = [], winner } = payload;
  const baseSections = [
    { heading: `Trade Study: ${topic}`, body: `Winner: ${winner?.name || winner || "TBD"}` },
    { heading: "Criteria", body: criteria.map((c: any) => `${c.name} (w=${c.weight}): ${c.description}`).join("\n") },
    { heading: "Alternatives", body: alternatives.map((a: any) => `${a.name}: ${a.rationale}`).join("\n") },
    {
      heading: "Scores",
      body: scored
        .map((s: any) => `${s.name}: total=${s.weightedTotal} | ${Object.entries(s.scores).map(([k, v]) => `${k}=${v}`).join(", ")}`)
        .join("\n")
    }
  ];

  // Attempt narrative enrichment if OpenAI key available
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const narrativePrompt = `Generate a concise executive summary (5-8 sentences) for the following trade study.
Topic: ${topic}
Criteria: ${criteria.map((c: any) => `${c.name}(w=${c.weight})`).join(", ")}
Alternatives: ${alternatives.map((a: any) => a.name).join(", ")}
Winner: ${winner?.name || winner || "TBD"}
Scores: ${scored.map((s: any) => `${s.name}=${s.weightedTotal}`).join(", ")}
Return ONLY plain text.`;
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You draft clear executive summaries for technical decision records." },
          { role: "user", content: narrativePrompt }
        ],
        temperature: 0.4
      });
      const narrative = completion.choices[0]?.message?.content?.trim();
      if (narrative) {
        baseSections.splice(1, 0, { heading: "Executive Summary", body: narrative });
      }
    } catch (e) {
      console.warn("[buildDocSectionsWithNarrative] narrative generation failed", e);
    }
  }

  return baseSections;
}

export async function exportToSheets({ tradeStudyId, userId, matrix, folderId }: ExportPayload & { userId?: string; matrix?: any; folderId?: string }) {
  try {
    if (!userId) return { status: "skipped", artifact: "sheet", message: "No userId provided" };
    const drive = await getDriveClient(userId);
    const sheets = await getSheetsClient(userId);
    const title = `Trade Study Scoring ${tradeStudyId}`;
    const fileMeta: any = await drive.files.create({
      requestBody: { name: title, mimeType: "application/vnd.google-apps.spreadsheet", parents: folderId ? [folderId] : undefined }
    });
    const fileId = fileMeta.data.id;
    if (!fileId) return { status: "error", artifact: "sheet", message: "Failed to create sheet" };

    const criteria: any[] = matrix?.criteria || [];
    const scored: any[] = matrix?.scored || [];
    const recommendations: string[] = matrix?.recommendations || [];

    // Create second sheet via batchUpdate before writing values
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: fileId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: "Sheet2" }
            }
          }
        ]
      }
    }).catch((err: any) => {
      console.warn("[exportToSheets] addSheet warning", err?.message || err);
    });

    // Primary scoring matrix (Sheet1)
    const header = ["Alternative", ...criteria.map((c) => c.name), "Weighted Total"];
    const rows = scored.map((s) => [s.name, ...criteria.map((c) => s.scores[c.name] ?? 0), s.weightedTotal]);
    await sheets.spreadsheets.values.update({
      spreadsheetId: fileId,
      range: "Sheet1!A1",
      valueInputOption: "RAW",
      requestBody: { values: [header, ...rows] }
    });

    // Criteria + recommendations (Sheet2)
    const criteriaSheetValues = [["Criterion", "Weight", "Description"], ...criteria.map((c) => [c.name, c.weight, c.description])];
    const recValues = recommendations.length ? [["Recommendations"], ...recommendations.map((r) => [r])] : [["Recommendations"], ["(none)"]];
    await sheets.spreadsheets.values.update({
      spreadsheetId: fileId,
      range: "Sheet2!A1",
      valueInputOption: "RAW",
      requestBody: { values: [...criteriaSheetValues, [""], ...recValues] }
    });
    console.log(`[exportToSheets] Populated sheets ${fileId} (${title})`);
    return { status: "ok", artifact: "sheet", fileId, message: "Sheets populated" };
  } catch (e) {
    console.error("[exportToSheets] error", e);
    return { status: "error", artifact: "sheet", message: e instanceof Error ? e.message : String(e) };
  }
}

export async function exportToSlides({ tradeStudyId, userId, folderId }: ExportPayload & { userId?: string; folderId?: string }) {
  try {
    if (!userId) return { status: "skipped", artifact: "slide", message: "No userId provided" };
    const drive = await getDriveClient(userId);
    const title = `Trade Study Slides ${tradeStudyId}`;
    const fileMeta: any = await drive.files.create({
      requestBody: { name: title, mimeType: "application/vnd.google-apps.presentation", parents: folderId ? [folderId] : undefined }
    });
    const fileId = fileMeta.data.id;
    console.log(`[exportToSlides] Created slides ${fileId} for study ${tradeStudyId}`);
    return { status: "ok", artifact: "slide", fileId, message: "Slides created" };
  } catch (e) {
    console.error("[exportToSlides] error", e);
    return { status: "error", artifact: "slide", message: e instanceof Error ? e.message : String(e) };
  }
}

export async function uploadToDrive({ tradeStudyId, userId, folderId }: ExportPayload & { userId?: string; folderId?: string }) {
  try {
    if (!userId) return { status: "skipped", artifact: "drive", message: "No userId provided" };
    if (!folderId) return { status: "skipped", artifact: "drive", message: "No folderId provided" };
    // Simple validation call
    const drive = await getDriveClient(userId);
    await drive.files.get({ fileId: folderId, fields: "id" });
    return { status: "ok", artifact: "drive", message: `Validated folder ${folderId}` };
  } catch (e) {
    console.error("[uploadToDrive] error", e);
    return { status: "error", artifact: "drive", message: e instanceof Error ? e.message : String(e) };
  }
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
  if (!userId || !account) {
    return { requiresLink: true, account: null, files: [] };
  }
  try {
    const drive = await getDriveClient(userId);
    const res = await drive.files.list({ pageSize: 20, fields: "files(id,name,mimeType)" });
    return {
      requiresLink: false,
      account: {
        id: account.id,
        scope: account.scope,
        refresh_token: account.refresh_token,
        expires_at: account.expires_at
      },
  files: (res.data.files || []).map((f: { id?: string; name?: string; mimeType?: string }) => ({ id: f.id!, name: f.name!, mimeType: f.mimeType! }))
    };
  } catch (e) {
    console.error("[listDriveFiles]", e);
    return { requiresLink: false, account: null, files: [] };
  }
}

// Legacy stub helpers removed: use exportToDocs/exportToSheets instead.
