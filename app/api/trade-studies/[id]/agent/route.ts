import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { runAgent, type AgentGoal, type AgentRequest } from "@/lib/agent/orchestrator";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  // 1. Authenticate
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Parse request body
    const body = await request.json();
    const { goal, extraContext, publishTargets } = body as {
      goal?: AgentGoal;
      extraContext?: string;
      publishTargets?: {
        doc?: boolean;
        sheet?: boolean;
        slides?: boolean;
        drive?: boolean;
      };
    };

    // 3. Validate goal
    const validGoals: AgentGoal[] = ["analyze", "score", "summarize", "publish", "full_workflow"];
    const agentGoal: AgentGoal = goal && validGoals.includes(goal) ? goal : "analyze";

    // 4. Build agent request
    const agentRequest: AgentRequest = {
      tradeStudyId: params.id,
      goal: agentGoal,
      extraContext,
      publishTargets,
      userId: session.user.id
    };

    // 5. Run the agent
    const result = await runAgent(agentRequest);

    // 6. Return result
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Agent execution failed",
          steps: result.steps
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      study: result.study,
      analysis: result.analysis,
      publishResults: result.publishResults,
      steps: result.steps
    });
  } catch (error) {
    console.error("[agent] error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
