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

    const parsed = JSON.parse(content);
    return TradeStudyAnalysisSchema.parse(parsed);
  } catch (error) {
    console.error("[analyzeTradeStudy] error:", error);
    throw new Error(
      `Failed to analyze trade study: ${error instanceof Error ? error.message : "Unknown error"}`
    );
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
