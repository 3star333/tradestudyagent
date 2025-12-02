import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ""
});

// Schema for structured trade study analysis
export const TradeStudyAnalysisSchema = z.object({
  summary: z.string().describe("High-level summary of the trade study analysis"),
  recommendations: z.array(z.string()).describe("Key recommendations for decision-makers"),
  updatedData: z
    .record(z.unknown())
    .optional()
    .describe("Updated JSON structure for the trade study data field"),
  nextSteps: z.array(z.string()).describe("Suggested next steps or actions")
});

export type TradeStudyAnalysis = z.infer<typeof TradeStudyAnalysisSchema>;

/**
 * Generate structured analysis for a trade study using OpenAI
 */
export async function analyzeTradeStudy(params: {
  studyTitle: string;
  studySummary?: string;
  studyData: Record<string, unknown>;
  goal: "summarize" | "score" | "draft_proposal" | "identify_gaps";
  extraContext?: string;
}): Promise<TradeStudyAnalysis> {
  const { studyTitle, studySummary, studyData, goal, extraContext } = params;

  if (!process.env.OPENAI_API_KEY) {
    // Fallback for missing API key
    return {
      summary: "OPENAI_API_KEY not configured. This is a stubbed response.",
      recommendations: ["Set OPENAI_API_KEY in .env.local", "Configure OpenAI organization if needed"],
      nextSteps: ["Review environment configuration"],
      updatedData: studyData
    };
  }

  const systemPrompt = `You are an expert technical consultant helping evaluate and document trade studies.
A trade study compares multiple options (technologies, vendors, architectures) against defined requirements and criteria.

Your job is to analyze the provided trade study data and ${getGoalDescription(goal)}.

Return your analysis in structured JSON format following the schema provided.`;

  const userPrompt = `Trade Study: ${studyTitle}
${studySummary ? `Summary: ${studySummary}\n` : ""}
Current Data:
${JSON.stringify(studyData, null, 2)}

${extraContext ? `Additional Context:\n${extraContext}\n` : ""}
Please ${getGoalDescription(goal)}.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.warn("[analyzeTradeStudy] JSON parse failed, wrapping raw content");
      parsed = { summary: content.slice(0, 400), recommendations: [], nextSteps: [] };
    }

    let validated = TradeStudyAnalysisSchema.safeParse(parsed);
    if (!validated.success) {
      console.warn("[analyzeTradeStudy] first pass schema validation failed", validated.error.issues);
      // Second attempt with corrective instructions
      const correctivePrompt = `The previous response failed validation for fields: ${validated.error.issues
        .map((i) => i.path.join("."))
        .join(", ")}.
Return STRICT JSON with keys: summary (string), recommendations (array of strings), nextSteps (array of strings), updatedData (object optionally).
Do NOT include markdown or commentary outside JSON.`;
      try {
        const retry = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
            { role: "assistant", content: content },
            { role: "user", content: correctivePrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3
        });
        const retryContent = retry.choices[0]?.message?.content;
        if (retryContent) {
          try {
            const retryParsed = JSON.parse(retryContent);
            const retryValidated = TradeStudyAnalysisSchema.safeParse(retryParsed);
            if (retryValidated.success) return retryValidated.data;
            validated = retryValidated; // use for fallback messaging
            parsed = retryParsed;
            console.warn("[analyzeTradeStudy] retry validation failed", retryValidated.error.issues);
          } catch (e) {
            console.warn("[analyzeTradeStudy] retry parse failed", e);
          }
        }
      } catch (e) {
        console.warn("[analyzeTradeStudy] retry attempt failed", e);
      }
    } else {
      return validated.data;
    }

    // If still not validated, proceed to fallback
    console.warn("[analyzeTradeStudy] schema validation failed after retry", validated.error.issues);
    const fallbackRecommendations = Array.isArray(parsed.recommendations)
      ? parsed.recommendations
      : buildHeuristicRecommendations(studyData);
    const fallbackNextSteps = Array.isArray(parsed.nextSteps)
      ? parsed.nextSteps
      : ["Refine prompt for structure", "Reduce token size", "Retry analysis", "Add explicit JSON schema notes in prompt"];
    return {
      summary:
        parsed.summary ||
        `Analysis incomplete. Validation errors: ${validated.error.issues
          .map((i) => i.path.join("."))
          .join(", ")}`,
      recommendations: fallbackRecommendations,
      nextSteps: fallbackNextSteps,
      updatedData:
        parsed.updatedData && typeof parsed.updatedData === "object"
          ? parsed.updatedData
          : undefined
    };
  } catch (error) {
    console.error("[analyzeTradeStudy] fatal error:", error);
    return {
      summary: `Failed to analyze trade study: ${error instanceof Error ? error.message : "Unknown error"}`,
      recommendations: [],
      nextSteps: ["Check OpenAI API key", "Reduce prompt size", "Retry later"],
      updatedData: studyData
    };
  }
}

function getGoalDescription(goal: string): string {
  switch (goal) {
    case "summarize":
      return "provide a clear summary of the trade study, highlighting key requirements, options being considered, and any preliminary findings";
    case "score":
      return "evaluate and score each option against the defined criteria, providing quantitative ratings and justifications";
    case "draft_proposal":
      return "draft a decision proposal recommending the best option(s) with supporting rationale";
    case "identify_gaps":
      return "identify gaps in the analysis, missing requirements, unclear criteria, or options that should be considered";
    default:
      return "analyze the trade study and provide actionable insights";
  }
}

function buildHeuristicRecommendations(data: Record<string, unknown>): string[] {
  const recs: string[] = [];
  if (Array.isArray((data as any).criteria) && (data as any).criteria.length === 0) {
    recs.push("Define 4-8 weighted criteria before scoring.");
  }
  if (Array.isArray((data as any).alternatives) && (data as any).alternatives.length < 2) {
    recs.push("Add at least two credible alternative options.");
  }
  if (!Array.isArray((data as any).sources) || (data as any).sources.length === 0) {
    recs.push("Perform external research to gather objective sources.");
  }
  if (!recs.length) {
    recs.push("Proceed to formal scoring and capture rationale for each criterion.");
  }
  return recs;
}

/**
 * Legacy function for simple text generation (kept for backward compatibility)
 */
export async function generateWithOpenAI(prompt: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return "OPENAI_API_KEY not set; returning stubbed response.";
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });

    return response.choices[0]?.message?.content || "No response generated";
  } catch (error) {
    console.error("[generateWithOpenAI] error:", error);
    return `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}
