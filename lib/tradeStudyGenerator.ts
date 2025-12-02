import { z } from "zod";
import { analyzeTradeStudy, generateWithOpenAI } from "./openai";
import { researchTools } from "./agent/research-tools";
import { createTradeStudy, updateTradeStudy, attachFileToTradeStudy } from "./studies";
import { exportToDocs, exportToSheets } from "./google";

// ---------------- Types ----------------
export const GenerationInputSchema = z.object({
  topic: z.string().min(5, "Topic too short"),
  folderId: z.string().optional(),
  depth: z.enum(["quick", "standard", "deep"]).default("standard"),
  generateArtifacts: z.boolean().default(true)
});

export type GenerationInput = z.infer<typeof GenerationInputSchema>;

export interface GeneratedCriteriaItem {
  name: string;
  description: string;
  weight: number; // 0-1 normalized
}

export interface GeneratedAlternative {
  name: string;
  rationale: string;
}

export interface ScoredAlternative extends GeneratedAlternative {
  scores: Record<string, number>; // criterion -> 0-10 raw score
  weightedTotal: number; // aggregated weighted score (0-10)
}

export interface GenerationResult {
  studyId: string;
  criteria: GeneratedCriteriaItem[];
  alternatives: GeneratedAlternative[];
  scored: ScoredAlternative[];
  winner?: ScoredAlternative;
  docFileId?: string;
  sheetFileId?: string;
  slideFileId?: string;
  researchSummary?: string;
  sources?: Array<{ title: string; url: string }>;
  exportStatuses?: Array<{ artifact: string; status: string; message: string; fileId?: string }>;
}

// ---------------- OpenAI Helpers ----------------
async function llmJson<T>(prompt: string, schema: z.ZodSchema<T>, fallback: T): Promise<T> {
  try {
    const raw = await generateWithOpenAI(prompt + "\nReturn ONLY valid JSON.");
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    const jsonSlice = firstBrace >= 0 ? raw.slice(firstBrace, lastBrace + 1) : raw;
    const parsed = JSON.parse(jsonSlice);
    return schema.parse(parsed);
  } catch (err) {
    console.warn("[llmJson] falling back due to error", err);
    return fallback;
  }
}

// ---------------- Generation Steps ----------------
export async function generateCriteria(topic: string): Promise<GeneratedCriteriaItem[]> {
  const schema = z.object({
    criteria: z.array(
      z.object({
        name: z.string(),
        description: z.string(),
        weight: z.number().min(0).max(1)
      })
    ).min(4).max(10)
  });

  const fallback: z.infer<typeof schema> = {
    criteria: [
      { name: "Cost", description: "Overall economic impact and pricing model", weight: 0.25 },
      { name: "Performance", description: "Latency, throughput, and efficiency", weight: 0.25 },
      { name: "Scalability", description: "Ability to grow with demand", weight: 0.25 },
      { name: "Maintainability", description: "Ease of operations & upgrades", weight: 0.25 }
    ]
  };

  const prompt = `You are designing a trade study. Topic: ${topic}.
List 4-10 evaluation criteria with short descriptions and weights summing to ~1.
Weights should reflect importance. Return JSON { "criteria": [ { "name": ..., "description": ..., "weight": 0.x } ] }`;
  const result = await llmJson(prompt, schema, fallback);
  // Normalize weights
  const total = result.criteria.reduce((acc, c) => acc + c.weight, 0) || 1;
  return result.criteria.map((c) => ({ ...c, weight: +(c.weight / total).toFixed(4) }));
}

export async function generateAlternatives(topic: string): Promise<GeneratedAlternative[]> {
  const schema = z.object({
    alternatives: z.array(
      z.object({ name: z.string(), rationale: z.string().min(5) })
    ).min(3).max(8)
  });
  const fallback: z.infer<typeof schema> = {
    alternatives: [
      { name: "Option A", rationale: "Baseline well-known approach." },
      { name: "Option B", rationale: "Innovative but less proven approach." },
      { name: "Option C", rationale: "Hybrid or combined strategy." }
    ]
  };
  const prompt = `Provide 3-8 distinct solution alternatives for: ${topic}.
Each with a concise rationale.
Return JSON { "alternatives": [ { "name": "...", "rationale": "..." } ] }`;
  const result = await llmJson(prompt, schema, fallback);
  return result.alternatives;
}

export async function scoreAlternatives(params: {
  topic: string;
  criteria: GeneratedCriteriaItem[];
  alternatives: GeneratedAlternative[];
  researchContext?: string;
}): Promise<ScoredAlternative[]> {
  const { topic, criteria, alternatives, researchContext } = params;
  const schema = z.object({
    scored: z.array(
      z.object({
        name: z.string(),
        scores: z.record(z.number().min(0).max(10)),
        rationale: z.string()
      })
    )
  });
  const fallback: z.infer<typeof schema> = {
    scored: alternatives.map((a) => ({
      name: a.name,
      rationale: a.rationale,
      scores: Object.fromEntries(criteria.map((c) => [c.name, 5]))
    }))
  };
  const prompt = `Score the following alternatives for a trade study on: ${topic}.
Criteria (with weight):\n${criteria.map((c) => `- ${c.name} (${c.weight}): ${c.description}`).join("\n")}\n
Alternatives:\n${alternatives.map((a) => `- ${a.name}: ${a.rationale}`).join("\n")}\n
${researchContext ? `Research Context:\n${researchContext}\n` : ""}
Return JSON { "scored": [ { "name": "...", "rationale": "...", "scores": { "Criterion": number } } ] }.
Scores are 0-10 integers or decimals.`;
  const result = await llmJson(prompt, schema, fallback);
  // Compute weighted totals
  return result.scored.map((s) => {
    const weightedTotal = criteria.reduce((acc, c) => acc + (s.scores[c.name] ?? 0) * c.weight, 0);
    return { ...s, weightedTotal: +weightedTotal.toFixed(3) };
  });
}

// ---------------- Orchestrator ----------------
export async function orchestrateTradeStudyGeneration(userId: string, input: GenerationInput): Promise<GenerationResult> {
  const { topic, folderId, depth, generateArtifacts } = input;
  // Step 1: Research (optional depth influences sources)
  const research = await researchTools.researchContext.execute({ topic, depth });
  const researchContext = `${research.summary}\nSources:\n${research.sources.map((s) => `${s.title} - ${s.url}`).join("\n")}`;

  // Step 2: Criteria
  const criteria = await generateCriteria(topic);
  // Step 3: Alternatives
  const alternatives = await generateAlternatives(topic);
  // Step 4: Scoring
  const scored = await scoreAlternatives({ topic, criteria, alternatives, researchContext });
  const winner = scored.slice().sort((a, b) => b.weightedTotal - a.weightedTotal)[0];

  // Step 5: Persist trade study
  const study = await createTradeStudy({
    ownerId: userId,
    title: topic,
    summary: research.summary,
    data: {
      criteria,
      alternatives,
      scored,
      winner: winner?.name,
      researchSources: research.sources,
      generationDepth: depth
    }
  });

  // Step 6: Analyze for gaps (optional enrichment)
  try {
    const analysis = await analyzeTradeStudy({
      studyTitle: topic,
      studySummary: research.summary,
      studyData: study.data as any,
      goal: "identify_gaps"
    });
    if (analysis.updatedData) {
      // Ensure both sides are plain objects before spreading
      const baseData = (study.data || {}) as Record<string, unknown>;
      const updatedData = analysis.updatedData as Record<string, unknown>;
      await updateTradeStudy({ tradeStudyId: study.id, data: { ...baseData, ...updatedData } });
    }
  } catch (e) {
    console.warn("[orchestrateTradeStudyGeneration] analysis step failed", e);
  }

  // Step 7: Artifact exports (Docs / Sheets)
  let docFileId: string | undefined;
  let sheetFileId: string | undefined;
  let slideFileId: string | undefined;
  const exportStatuses: Array<{ artifact: string; status: string; message: string; fileId?: string }> = [];
  if (generateArtifacts) {
    try {
      const doc = await exportToDocs({ tradeStudyId: study.id, payload: { topic, criteria, alternatives, scored, winner, userId }, userId, folderId });
      exportStatuses.push({ artifact: 'doc', status: (doc as any).status, message: (doc as any).message, fileId: (doc as any).fileId });
      if ((doc as any).fileId) docFileId = (doc as any).fileId;
      if (docFileId) {
        await attachFileToTradeStudy({ tradeStudyId: study.id, fileId: docFileId, type: "doc", title: `${topic} Summary` });
      }
    } catch (e) {
      console.warn("[Docs export] failed", e);
      exportStatuses.push({ artifact: 'doc', status: 'error', message: e instanceof Error ? e.message : String(e) });
    }
    try {
      const sheet = await exportToSheets({ tradeStudyId: study.id, userId, folderId, matrix: { criteria, scored } });
      exportStatuses.push({ artifact: 'sheet', status: (sheet as any).status, message: (sheet as any).message, fileId: (sheet as any).fileId });
      if ((sheet as any).fileId) sheetFileId = (sheet as any).fileId;
      if (sheetFileId) {
        await attachFileToTradeStudy({ tradeStudyId: study.id, fileId: sheetFileId, type: "sheet", title: `${topic} Scoring` });
      }
    } catch (e) {
      console.warn("[Sheets export] failed", e);
      exportStatuses.push({ artifact: 'sheet', status: 'error', message: e instanceof Error ? e.message : String(e) });
    }
    try {
      const slides = await import('./google').then(m => m.exportToSlides({ tradeStudyId: study.id, userId, folderId }));
      exportStatuses.push({ artifact: 'slide', status: (slides as any).status, message: (slides as any).message, fileId: (slides as any).fileId });
      if ((slides as any).fileId) slideFileId = (slides as any).fileId;
      if (slideFileId) {
        await attachFileToTradeStudy({ tradeStudyId: study.id, fileId: slideFileId, type: "slide", title: `${topic} Slides` });
      }
    } catch (e) {
      console.warn('[Slides export] failed', e);
      exportStatuses.push({ artifact: 'slide', status: 'error', message: e instanceof Error ? e.message : String(e) });
    }
  }

  return {
    studyId: study.id,
    criteria,
    alternatives,
    scored,
    winner,
    docFileId,
  sheetFileId,
  slideFileId,
    researchSummary: research.summary,
  sources: research.sources.map((s) => ({ title: s.title, url: s.url })),
  exportStatuses
  };
}

// Convenience wrapper for API route
export async function generateTradeStudy(userId: string, rawInput: unknown) {
  const parsed = GenerationInputSchema.parse(rawInput);
  return orchestrateTradeStudyGeneration(userId, parsed);
}
