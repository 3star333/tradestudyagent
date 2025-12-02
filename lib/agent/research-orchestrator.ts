import { tools } from "./tools";
import { researchTools } from "./research-tools";
import type { TradeStudyRecord } from "../studies";
import type { TradeStudyAnalysis } from "../openai";

/**
 * Enhanced orchestrator with research capabilities
 * Extends the base orchestrator with web search and content fetching
 */

export type ResearchAgentGoal = 
  | "analyze" 
  | "score" 
  | "summarize" 
  | "publish" 
  | "full_workflow"
  | "research_topic"           // NEW: Research a specific topic
  | "enrich_with_research"     // NEW: Research and add findings to study
  | "validate_assumptions";    // NEW: Validate study assumptions with research

export type ResearchAgentRequest = {
  tradeStudyId: string;
  goal: ResearchAgentGoal;
  extraContext?: string;
  researchParams?: {
    topic?: string;
    depth?: "quick" | "standard" | "deep";
    sources?: string[];  // Specific URLs to research
  };
  publishTargets?: {
    doc?: boolean;
    sheet?: boolean;
    slides?: boolean;
    drive?: boolean;
  };
};

export type ResearchAgentResult = {
  success: boolean;
  study: TradeStudyRecord | null;
  analysis?: TradeStudyAnalysis;
  researchFindings?: {
    topic: string;
    summary: string;
    keyFindings: string[];
    sources: Array<{ title: string; url: string; relevance: string }>;
  };
  publishResults?: Array<{ target: string; status: string; message: string }>;
  steps: Array<{ tool: string; status: string; message: string }>;
  error?: string;
};

/**
 * Main research orchestrator function
 * Coordinates research tools with trade study analysis
 */
export async function runResearchAgent(
  request: ResearchAgentRequest
): Promise<ResearchAgentResult> {
  const { tradeStudyId, goal, extraContext, researchParams, publishTargets } = request;
  const steps: Array<{ tool: string; status: string; message: string }> = [];

  try {
    // Step 1: Load the trade study
    const study = await tools.loadTradeStudy.execute({ tradeStudyId });
    if (!study) {
      return {
        success: false,
        study: null,
        steps: [{ tool: "load_trade_study", status: "error", message: "Trade study not found" }],
        error: "Trade study not found"
      };
    }
    steps.push({ tool: "load_trade_study", status: "ok", message: `Loaded "${study.title}"` });

    let analysis: TradeStudyAnalysis | undefined;
    let researchFindings: ResearchAgentResult["researchFindings"];
    let publishResults: ResearchAgentResult["publishResults"];

    // Step 2: Execute based on goal
    switch (goal) {
      case "research_topic": {
        // Research a specific topic
        const topic = researchParams?.topic || study.title;
        const depth = researchParams?.depth || "standard";
        
        const research = await researchTools.researchContext.execute({
          topic,
          sources: researchParams?.sources,
          depth
        });
        
        researchFindings = research;
        steps.push({
          tool: "research_context",
          status: "ok",
          message: `Researched "${topic}" with ${research.sources.length} sources`
        });
        break;
      }

      case "enrich_with_research": {
        // Research and add findings to the study
        const topic = researchParams?.topic || study.title;
        
        // First, do the research
        const research = await researchTools.researchContext.execute({
          topic,
          sources: researchParams?.sources,
          depth: researchParams?.depth || "standard"
        });
        researchFindings = research;
        steps.push({
          tool: "research_context",
          status: "ok",
          message: `Researched "${topic}"`
        });

        // Then, analyze with the research context
        const contextWithResearch = `
${extraContext || ""}

RESEARCH FINDINGS:
${research.summary}

KEY FINDINGS:
${research.keyFindings.map((f, i) => `${i + 1}. ${f}`).join("\n")}

SOURCES:
${research.sources.map(s => `- ${s.title}: ${s.url}`).join("\n")}
        `.trim();

        analysis = await tools.analyzeWithLLM.execute({
          tradeStudyId,
          goal: "identify_gaps",
          extraContext: contextWithResearch
        });
        steps.push({
          tool: "analyze_with_llm",
          status: "ok",
          message: "Analyzed study with research findings"
        });

        // Update study with enriched data
        if (analysis.updatedData) {
          const updated = await tools.updateTradeStudy.execute({
            tradeStudyId,
            data: {
              ...analysis.updatedData,
              researchSources: research.sources,
              lastResearchDate: new Date().toISOString()
            }
          });
          if (updated) {
            steps.push({
              tool: "update_trade_study",
              status: "ok",
              message: "Updated study with research findings"
            });
          }
        }
        break;
      }

      case "validate_assumptions": {
        // Research to validate assumptions in the study
        const studyData = study.data as Record<string, unknown>;
        const assumptions = studyData.assumptions as string[] || [];
        
        if (assumptions.length === 0) {
          steps.push({
            tool: "validate_assumptions",
            status: "skipped",
            message: "No assumptions found to validate"
          });
          break;
        }

        // Research each assumption
        const validationResults = await Promise.all(
          assumptions.slice(0, 3).map(async (assumption) => {
            const research = await researchTools.researchContext.execute({
              topic: `Validate: ${assumption}`,
              depth: "quick"
            });
            return {
              assumption,
              research: research.summary,
              sources: research.sources.slice(0, 2)
            };
          })
        );

        researchFindings = {
          topic: "Assumption Validation",
          summary: `Validated ${validationResults.length} assumptions`,
          keyFindings: validationResults.map(r => r.research),
          sources: validationResults.flatMap(r => r.sources)
        };

        steps.push({
          tool: "research_context",
          status: "ok",
          message: `Validated ${validationResults.length} assumptions`
        });
        break;
      }

      case "analyze":
      case "score":
      case "summarize": {
        // Standard analysis without research
        analysis = await tools.analyzeWithLLM.execute({
          tradeStudyId,
          goal: goal === "summarize" ? "summarize" : goal === "score" ? "score" : "identify_gaps",
          extraContext
        });
        steps.push({
          tool: "analyze_with_llm",
          status: "ok",
          message: `Completed ${goal} analysis`
        });

        if (analysis.updatedData) {
          await tools.updateTradeStudy.execute({
            tradeStudyId,
            data: analysis.updatedData
          });
          steps.push({
            tool: "update_trade_study",
            status: "ok",
            message: "Updated study data"
          });
        }
        break;
      }

      case "publish": {
        if (!publishTargets) {
          steps.push({
            tool: "publish_to_google",
            status: "skipped",
            message: "No publish targets specified"
          });
          break;
        }

        publishResults = await tools.publishToGoogle.execute({
          tradeStudyId,
          targets: publishTargets
        });
        steps.push({
          tool: "publish_to_google",
          status: "ok",
          message: `Published to ${publishResults.length} target(s)`
        });
        break;
      }

      case "full_workflow": {
        // Full workflow: Research → Analyze → Publish
        const topic = researchParams?.topic || study.title;
        
        // 1. Research
        const research = await researchTools.researchContext.execute({
          topic,
          depth: researchParams?.depth || "standard",
          sources: researchParams?.sources
        });
        researchFindings = research;
        steps.push({
          tool: "research_context",
          status: "ok",
          message: `Researched "${topic}"`
        });

        // 2. Analyze with research
        analysis = await tools.analyzeWithLLM.execute({
          tradeStudyId,
          goal: "identify_gaps",
          extraContext: `RESEARCH: ${research.summary}\n\n${extraContext || ""}`
        });
        steps.push({
          tool: "analyze_with_llm",
          status: "ok",
          message: "Analyzed with research context"
        });

        // 3. Update
        if (analysis.updatedData) {
          await tools.updateTradeStudy.execute({
            tradeStudyId,
            data: {
              ...analysis.updatedData,
              researchSources: research.sources
            }
          });
          steps.push({
            tool: "update_trade_study",
            status: "ok",
            message: "Updated study"
          });
        }

        // 4. Publish (if targets provided)
        if (publishTargets) {
          publishResults = await tools.publishToGoogle.execute({
            tradeStudyId,
            targets: publishTargets
          });
          steps.push({
            tool: "publish_to_google",
            status: "ok",
            message: "Published results"
          });
        }
        break;
      }
    }

    return {
      success: true,
      study,
      analysis,
      researchFindings,
      publishResults,
      steps
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      study: null,
      steps: [...steps, { tool: "orchestrator", status: "error", message: errorMessage }],
      error: errorMessage
    };
  }
}
