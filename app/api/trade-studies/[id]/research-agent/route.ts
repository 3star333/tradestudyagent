import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runResearchAgent, type ResearchAgentRequest } from "@/lib/agent/research-orchestrator";

/**
 * POST /api/trade-studies/:id/research-agent
 * Run the research-enabled AI agent on a trade study
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { goal, extraContext, researchParams, publishTargets } = body;

    if (!goal) {
      return NextResponse.json(
        { error: "Missing required field: goal" },
        { status: 400 }
      );
    }

    // Build agent request
    const agentRequest: ResearchAgentRequest = {
      tradeStudyId: params.id,
      goal,
      extraContext,
      researchParams,
      publishTargets
    };

    // Run the research agent
    const result = await runResearchAgent(agentRequest);

    // Return results
    return NextResponse.json({
      success: result.success,
      study: result.study,
      analysis: result.analysis,
      researchFindings: result.researchFindings,
      publishResults: result.publishResults,
      steps: result.steps,
      error: result.error
    });
  } catch (error) {
    console.error("[Research Agent API Error]", error);
    return NextResponse.json(
      {
        error: "Agent execution failed",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Force dynamic execution to avoid build-time data collection errors
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
