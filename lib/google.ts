// Placeholder for Google APIs (Docs, Sheets, Slides, Drive).
// Wire up with googleapis package and service account credentials before using in production.

import type { Account } from "@prisma/client";
import { db } from "./db";
import { getDriveClient, getDocsClient, getSheetsClient } from "./googleClient";
import { getTradeStudyById } from "./studies";
import OpenAI from "openai";

interface ExportPayload {
  tradeStudyId?: string;
  payload?: unknown;
}

export async function exportToDocs({ tradeStudyId, payload, userId, folderId }: ExportPayload & { userId?: string; folderId?: string }) {
  if (!tradeStudyId) return { status: "error", artifact: "doc", message: "Missing tradeStudyId" };
  try {
    if (!userId) return { status: "skipped", artifact: "doc", message: "No userId provided" };
    const study = await getTradeStudyById(tradeStudyId);
    const docs = await getDocsClient(userId);
    const title = study?.title || (payload as any)?.topic || `Trade Study ${tradeStudyId}`;

    // Create document using Docs API (preferred over Drive create for immediate write readiness)
    const created = await docs.documents.create({ requestBody: { title } });
    const documentId = created.data.documentId;
    if (!documentId) return { status: "error", artifact: "doc", message: "Failed to create document" };

    if (folderId) {
      // Move file to folder if provided
      const drive = await getDriveClient(userId);
      await drive.files.update({ fileId: documentId, addParents: folderId, fields: "id, parents" }).catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn("[exportToDocs] folder move warning", msg);
      });
    }

    const data = (payload as any) || study?.data || {};
    const sections = data.criteria ? await buildDocSectionsWithNarrative({ ...data, topic: title }) : [];
    if (sections.length === 0) return { status: "ok", artifact: "doc", fileId: documentId, message: "Doc created (no content)" };

    const requests = sections.flatMap((s: any, idx: number) => {
      return [
        {
          insertText: { endOfSegmentLocation: {}, text: (idx === 0 ? "" : "\n\n") + s.heading + "\n" + s.body }
        }
      ];
    });

    // Simple retry wrapper
    const attemptBatch = async () => {
      return await docs.documents.batchUpdate({ documentId, requestBody: { requests } });
    };
    let lastErr: any;
    for (let i = 0; i < 3; i++) {
      try {
    const resp = await attemptBatch();
    console.log(`[exportToDocs] batchUpdate success id=${resp.data.documentId}`);
        return { status: "ok", artifact: "doc", fileId: documentId, message: "Doc populated" };
      } catch (e) {
    lastErr = e;
        const backoff = 300 * (i + 1);
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[exportToDocs] batchUpdate attempt ${i + 1} failed; retrying in ${backoff}ms: ${msg}`);
        await new Promise(r => setTimeout(r, backoff));
      }
    }
  const finalMsg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  console.error("[exportToDocs] failed after retries", finalMsg);
    return { status: "error", artifact: "doc", fileId: documentId, message: lastErr instanceof Error ? lastErr.message : String(lastErr) };
  } catch (e) {
    console.error("[exportToDocs] fatal", e);
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
  const study = await getTradeStudyById(String(tradeStudyId));
    const sheets = await getSheetsClient(userId);
    const title = study?.title || `Trade Study Scoring ${tradeStudyId}`;
    const criteria: any[] = matrix?.criteria || [];
    const scored: any[] = matrix?.scored || [];
    const recommendations: string[] = matrix?.recommendations || [];

    const scoringHeader = ["Alternative", ...criteria.map((c) => c.name), "Weighted Total"];
    const scoringRows = scored.map((s) => [s.name, ...criteria.map((c) => s.scores[c.name] ?? 0), s.weightedTotal]);
    const sheet1Values = [scoringHeader, ...scoringRows];
    const sheet2Values = [["Criterion", "Weight", "Description"], ...criteria.map((c) => [c.name, c.weight, c.description]), [""], ["Recommendations"], ...recommendations.map(r => [r || ""])];

    const created = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title },
        sheets: [
          {
            properties: { title: "Scoring" },
            data: [
              {
                startRow: 0,
                startColumn: 0,
                rowData: sheet1Values.map(row => ({ values: row.map(v => ({ userEnteredValue: { stringValue: String(v) } })) }))
              }
            ]
          },
          {
            properties: { title: "Criteria" },
            data: [
              {
                startRow: 0,
                startColumn: 0,
                rowData: sheet2Values.map(row => ({ values: row.map(v => ({ userEnteredValue: { stringValue: String(v) } })) }))
              }
            ]
          }
        ]
      }
    });
    const spreadsheetId = created.data.spreadsheetId;
    if (!spreadsheetId) return { status: "error", artifact: "sheet", message: "Failed to create spreadsheet" };

    if (folderId) {
      const drive = await getDriveClient(userId);
      await drive.files.update({ fileId: spreadsheetId, addParents: folderId, fields: "id, parents" }).catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn("[exportToSheets] folder move warning", msg);
      });
    }
    console.log(`[exportToSheets] Created & populated spreadsheet ${spreadsheetId} (${title})`);
    return { status: "ok", artifact: "sheet", fileId: spreadsheetId, message: "Spreadsheet populated" };
  } catch (e) {
    console.error("[exportToSheets] fatal", e);
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
