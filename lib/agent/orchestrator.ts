import { tools, type ToolName } from "./tools";
import type { TradeStudyRecord } from "../studies";
import type { TradeStudyAnalysis } from "../openai";

/**
 * Simplified orchestrator for trade study agent workflows
 * This is an MCP-style approach: we have a set of tools the agent can use,
 * and an orchestrator that coordinates them based on the user's goal
 */

export type AgentGoal = "analyze" | "score" | "summarize" | "publish" | "full_workflow";

export type AgentRequest = {
  tradeStudyId: string;
  goal: AgentGoal;
  extraContext?: string;
  publishTargets?: {
    doc?: boolean;
    sheet?: boolean;
    slides?: boolean;
    drive?: boolean;
  };
};

export type AgentResult = {
  success: boolean;
  study: TradeStudyRecord | null;
  analysis?: TradeStudyAnalysis;
  publishResults?: Array<{ target: string; status: string; message: string }>;
  steps: Array<{ tool: string; status: string; message: string }>;
  error?: string;
};

/**
 * Main orchestrator function
 * Routes the goal to appropriate tools and returns results
 */
export async function runAgent(request: AgentRequest): Promise<AgentResult> {
  const { tradeStudyId, goal, extraContext, publishTargets } = request;
  const steps: Array<{ tool: string; status: string; message: string }> = [];

  try {
    // Step 1: Always load the trade study first
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
    let publishResults: AgentResult["publishResults"];

    // Step 2: Execute based on goal
    switch (goal) {
      case "analyze":
      case "summarize": {
        analysis = await tools.analyzeWithLLM.execute({
          tradeStudyId,
          goal: goal === "summarize" ? "summarize" : "identify_gaps",
          extraContext
        });
        steps.push({
          tool: "analyze_with_llm",
          status: "ok",
          message: `Completed ${goal} analysis`
        });

        // Update study with new data if provided
        if (analysis.updatedData) {
          const updated = await tools.updateTradeStudy.execute({
            tradeStudyId,
            data: analysis.updatedData
          });
          if (updated) {
            steps.push({
              tool: "update_trade_study",
              status: "ok",
              message: "Updated study data with analysis results"
            });
          }
        }
        break;
      }

      case "score": {
        analysis = await tools.analyzeWithLLM.execute({
          tradeStudyId,
          goal: "score",
          extraContext
        });
        steps.push({ tool: "analyze_with_llm", status: "ok", message: "Scored all options" });

        if (analysis.updatedData) {
          await tools.updateTradeStudy.execute({
            tradeStudyId,
            data: analysis.updatedData
          });
          steps.push({
            tool: "update_trade_study",
            status: "ok",
            message: "Saved scoring results"
          });
        }
        break;
      }

      case "publish": {
        if (!publishTargets || Object.keys(publishTargets).length === 0) {
          steps.push({
            tool: "publish_to_google",
            status: "skipped",
            message: "No publish targets specified"
          });
        } else {
          publishResults = await tools.publishToGoogle.execute({
            tradeStudyId,
            targets: publishTargets
          });
          steps.push({
            tool: "publish_to_google",
            status: "ok",
            message: `Published to ${publishResults.length} target(s)`
          });
        }
        break;
      }

      case "full_workflow": {
        // Full workflow: analyze -> score -> publish
        analysis = await tools.analyzeWithLLM.execute({
          tradeStudyId,
          goal: "draft_proposal",
          extraContext
        });
        steps.push({
          tool: "analyze_with_llm",
          status: "ok",
          message: "Drafted proposal"
        });

        if (analysis.updatedData) {
          await tools.updateTradeStudy.execute({
            tradeStudyId,
            data: analysis.updatedData,
            status: "in_review"
          });
          steps.push({
            tool: "update_trade_study",
            status: "ok",
            message: "Updated study status to in_review"
          });
        }

        if (publishTargets && Object.keys(publishTargets).length > 0) {
          publishResults = await tools.publishToGoogle.execute({
            tradeStudyId,
            targets: publishTargets
          });
          steps.push({
            tool: "publish_to_google",
            status: "ok",
            message: `Published to ${publishResults.length} target(s)`
          });
        }
        break;
      }
    }

    // Reload final state
    const finalStudy = await tools.loadTradeStudy.execute({ tradeStudyId });

    return {
      success: true,
      study: finalStudy,
      analysis,
      publishResults,
      steps
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    steps.push({ tool: "orchestrator", status: "error", message });
    return {
      success: false,
      study: null,
      steps,
      error: message
    };
  }
}
