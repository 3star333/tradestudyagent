"use client";

import { useState } from "react";
import { Loader2, PlayCircle, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AgentGoal = "analyze" | "score" | "summarize" | "publish" | "full_workflow";

type AgentStep = {
  tool: string;
  status: string;
  message: string;
};

type AgentResponse = {
  success: boolean;
  error?: string;
  analysis?: {
    summary: string;
    recommendations: string[];
    nextSteps: string[];
  };
  publishResults?: Array<{ target: string; status: string; message: string }>;
  steps: AgentStep[];
};

export function AgentRunner({ tradeStudyId }: { tradeStudyId: string }) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<AgentResponse | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<AgentGoal>("analyze");

  const goals: Array<{ value: AgentGoal; label: string; description: string }> = [
    {
      value: "analyze",
      label: "Analyze",
      description: "Identify gaps, missing requirements, and areas for improvement"
    },
    {
      value: "summarize",
      label: "Summarize",
      description: "Generate a clear summary of the trade study"
    },
    {
      value: "score",
      label: "Score Options",
      description: "Evaluate and score each option against criteria"
    },
    {
      value: "publish",
      label: "Publish",
      description: "Export to Google Docs/Sheets/Slides (stub)"
    },
    {
      value: "full_workflow",
      label: "Full Workflow",
      description: "Analyze, score, and draft proposal"
    }
  ];

  async function handleRun() {
    setIsRunning(true);
    setResult(null);

    try {
      const response = await fetch(`/api/trade-studies/${tradeStudyId}/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: selectedGoal,
          publishTargets:
            selectedGoal === "publish" || selectedGoal === "full_workflow"
              ? { doc: true, sheet: true }
              : undefined
        })
      });

      const data = await response.json();
      setResult(data);

  // Removed auto-reload to allow user to read messages; manual refresh button provided.
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        steps: []
      });
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5" />
          AI Agent
        </CardTitle>
        <CardDescription>
          Run the trade study agent to analyze, score, or publish results using OpenAI + MCP-style tools.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Select goal</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {goals.map((goal) => (
              <button
                key={goal.value}
                type="button"
                onClick={() => setSelectedGoal(goal.value)}
                disabled={isRunning}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors",
                  selectedGoal === goal.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input hover:bg-accent",
                  isRunning && "cursor-not-allowed opacity-50"
                )}
              >
                <span className="font-semibold text-sm">{goal.label}</span>
                <span className="text-xs text-muted-foreground">{goal.description}</span>
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleRun} disabled={isRunning} className="w-full gap-2">
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Running agent...
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4" />
              Run Agent
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-4 rounded-md border bg-muted/50 p-4">
            <div className="flex items-center gap-2">
              {result.success ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-600">Agent completed successfully</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  <span className="font-semibold text-destructive">Agent failed</span>
                </>
              )}
            </div>

            {result.error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {result.error}
              </div>
            )}

            {result.steps && result.steps.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Execution steps
                </p>
                {result.steps.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-md bg-background/50 px-3 py-2 text-sm"
                  >
                    {step.status === "ok" ? (
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                    ) : step.status === "error" ? (
                      <AlertCircle className="h-4 w-4 mt-0.5 text-destructive flex-shrink-0" />
                    ) : (
                      <div className="h-4 w-4 mt-0.5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{step.tool.replace(/_/g, " ")}</p>
                      <p className="text-xs text-muted-foreground">{step.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {result.analysis && (
              <div className="space-y-3 rounded-md border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Analysis
                </p>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-semibold">Summary</p>
                    <p className="text-muted-foreground">{result.analysis.summary}</p>
                  </div>
                  {result.analysis.recommendations && result.analysis.recommendations.length > 0 && (
                    <div>
                      <p className="font-semibold">Recommendations</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {result.analysis.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.analysis.nextSteps && result.analysis.nextSteps.length > 0 && (
                    <div>
                      <p className="font-semibold">Next Steps</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {result.analysis.nextSteps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {result.publishResults && result.publishResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Publish results
                </p>
                {result.publishResults.map((pub, i) => (
                  <div key={i} className="rounded-md bg-background/50 px-3 py-2 text-sm">
                    <p className="font-medium">{pub.target}</p>
                    <p className="text-xs text-muted-foreground">
                      {pub.status}: {pub.message}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {result && result.success && (
              <div className="flex flex-col gap-2 pt-2">
                <p className="text-xs text-muted-foreground">
                  Agent finished. Review results below. Refresh manually if you need latest persisted data.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="self-start"
                >
                  Refresh Study Data
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
