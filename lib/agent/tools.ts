import { z } from "zod";
import { getTradeStudyById, updateTradeStudy, type TradeStudyRecord } from "../studies";
import { exportToDocs, exportToSheets, exportToSlides, uploadToDrive } from "../google";
import { analyzeTradeStudy, type TradeStudyAnalysis } from "../openai";

/**
 * MCP-style tools for trade study agent
 * Each tool has a schema (for validation) and an execute function
 */

// ==================== Load Trade Study ====================
export const loadTradeStudySchema = z.object({
  tradeStudyId: z.string().describe("The ID of the trade study to load")
});

export async function loadTradeStudyTool(
  input: z.infer<typeof loadTradeStudySchema>
): Promise<TradeStudyRecord | null> {
  const study = await getTradeStudyById(input.tradeStudyId);
  return study || null;
}

// ==================== Update Trade Study ====================
export const updateTradeStudySchema = z.object({
  tradeStudyId: z.string().describe("The ID of the trade study to update"),
  title: z.string().optional().describe("New title for the study"),
  summary: z.string().optional().describe("New summary for the study"),
  status: z.enum(["draft", "in_review", "published", "archived"]).optional().describe("New status"),
  data: z.record(z.unknown()).optional().describe("Updated JSON data for the study")
});

export async function updateTradeStudyTool(
  input: z.infer<typeof updateTradeStudySchema>
): Promise<TradeStudyRecord | null> {
  const { tradeStudyId, ...updates } = input;
  const updated = await updateTradeStudy({ tradeStudyId, ...updates });
  if (!updated) return null;
  
  // Reload with attachments to match TradeStudyRecord type
  const reloaded = await getTradeStudyById(tradeStudyId);
  return reloaded || null;
}

// ==================== Analyze with LLM ====================
export const analyzeWithLLMSchema = z.object({
  tradeStudyId: z.string().describe("The ID of the trade study to analyze"),
  goal: z
    .enum(["summarize", "score", "draft_proposal", "identify_gaps"])
    .describe("The analysis goal: summarize, score options, draft proposal, or identify gaps"),
  extraContext: z.string().optional().describe("Additional context or instructions for the analysis")
});

export async function analyzeWithLLMTool(
  input: z.infer<typeof analyzeWithLLMSchema>
): Promise<TradeStudyAnalysis> {
  const study = await getTradeStudyById(input.tradeStudyId);
  if (!study) {
    throw new Error(`Trade study ${input.tradeStudyId} not found`);
  }

  return analyzeTradeStudy({
    studyTitle: study.title,
    studySummary: study.summary || undefined,
    studyData: (study.data as Record<string, unknown>) || {},
    goal: input.goal,
    extraContext: input.extraContext
  });
}

// ==================== Publish to Google ====================
export const publishToGoogleSchema = z.object({
  tradeStudyId: z.string().describe("The ID of the trade study to publish"),
  targets: z
    .object({
      doc: z.boolean().optional().describe("Export to Google Docs"),
      sheet: z.boolean().optional().describe("Export to Google Sheets"),
      slides: z.boolean().optional().describe("Export to Google Slides"),
      drive: z.boolean().optional().describe("Upload to Google Drive")
    })
    .describe("Which Google services to publish to")
});

export type PublishResult = {
  target: string;
  status: "ok" | "error" | "skipped";
  message: string;
};

export async function publishToGoogleTool(
  input: z.infer<typeof publishToGoogleSchema>
): Promise<PublishResult[]> {
  const { tradeStudyId, targets } = input;
  const results: PublishResult[] = [];

  const study = await getTradeStudyById(tradeStudyId);
  if (!study) {
    return [{ target: "all", status: "error", message: "Trade study not found" }];
  }

  const payload = { tradeStudyId, payload: study.data };

  if (targets.doc) {
    const result = await exportToDocs(payload);
    results.push({
      target: "Google Docs",
      status: result.status as "ok" | "error" | "skipped",
      message: result.message || "Export completed"
    });
  }

  if (targets.sheet) {
    const result = await exportToSheets(payload);
    results.push({
      target: "Google Sheets",
      status: result.status as "ok" | "error" | "skipped",
      message: result.message || "Export completed"
    });
  }

  if (targets.slides) {
    const result = await exportToSlides(payload);
    results.push({
      target: "Google Slides",
      status: result.status as "ok" | "error" | "skipped",
      message: result.message || "Export completed"
    });
  }

  if (targets.drive) {
    const result = await uploadToDrive(payload);
    results.push({
      target: "Google Drive",
      status: result.status as "ok" | "error" | "skipped",
      message: result.message || "Upload completed"
    });
  }

  return results;
}

// ==================== Tool Registry ====================
export const tools = {
  loadTradeStudy: {
    name: "load_trade_study",
    description: "Load a trade study by ID to view its current state",
    schema: loadTradeStudySchema,
    execute: loadTradeStudyTool
  },
  updateTradeStudy: {
    name: "update_trade_study",
    description: "Update a trade study's title, summary, status, or data",
    schema: updateTradeStudySchema,
    execute: updateTradeStudyTool
  },
  analyzeWithLLM: {
    name: "analyze_with_llm",
    description:
      "Use AI to analyze a trade study: summarize, score options, draft proposal, or identify gaps",
    schema: analyzeWithLLMSchema,
    execute: analyzeWithLLMTool
  },
  publishToGoogle: {
    name: "publish_to_google",
    description: "Publish trade study artifacts to Google Docs, Sheets, Slides, or Drive",
    schema: publishToGoogleSchema,
    execute: publishToGoogleTool
  }
} as const;

export type ToolName = keyof typeof tools;
