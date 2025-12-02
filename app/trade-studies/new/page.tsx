"use client";
import { Lightbulb, Save, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useRouter } from "next/navigation";

type GenState =
  | { status: "idle" }
  | { status: "running"; message?: string }
  | { status: "error"; error: string }
  | { status: "done"; studyId: string; winner?: string; exportStatuses?: Array<{ artifact: string; status: string; message: string; fileId?: string }> };

export default function NewTradeStudyPage() {
  const [topic, setTopic] = useState("");
  const [folderId, setFolderId] = useState("");
  const [depth, setDepth] = useState("standard");
  const [state, setState] = useState<GenState>({ status: "idle" });
  const router = useRouter();

  async function startGeneration() {
    if (!topic || topic.length < 5) {
      setState({ status: "error", error: "Topic must be at least 5 characters." });
      return;
    }
    setState({ status: "running", message: "Generating trade study..." });
    try {
      const res = await fetch("/api/trade-studies/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, folderId: folderId || undefined, depth, generateArtifacts: true })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed: ${res.status}`);
      }
      const data = await res.json();
      const studyId: string | undefined = data?.result?.studyId;
      const winner: string | undefined = data?.result?.winner?.name || data?.result?.winner;
      const exportStatuses = data?.result?.exportStatuses;
      if (studyId) {
        setState({ status: "done", studyId, winner, exportStatuses });
        // Navigate after a short delay
        setTimeout(() => router.push(`/trade-studies/${studyId}`), 800);
      } else {
        throw new Error("Missing studyId in response");
      }
    } catch (e) {
      setState({ status: "error", error: e instanceof Error ? e.message : String(e) });
    }
  }

  return (
    <div className="mx-auto max-w-screen-md px-4 py-10 sm:py-14">
      <Card>
        <CardHeader>
          <CardTitle>Autonomous Trade Study Generator</CardTitle>
          <CardDescription>
            Enter a topic and optionally a Google Drive folder ID. The agent will research, create criteria,
            generate alternatives, score them, and produce artifacts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="topic">Topic / Problem Statement</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Select a vector database for AI features"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="folder">Drive Folder ID (optional)</Label>
            <Input
              id="folder"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              placeholder="e.g. 1AbcDEFghIjkLMNop"
            />
            <p className="text-xs text-muted-foreground">Provide a Google Drive folder to store generated docs & sheets.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="depth">Research Depth</Label>
            <select
              id="depth"
              value={depth}
              onChange={(e) => setDepth(e.target.value)}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="quick">Quick</option>
              <option value="standard">Standard</option>
              <option value="deep">Deep</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={startGeneration} disabled={state.status === "running" || !topic} className="gap-2">
              {state.status === "running" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
              {state.status === "running" ? "Generating..." : "Generate Study"}
            </Button>
            <Button variant="outline" disabled className="gap-2">
              <Save className="h-4 w-4" />
              Manual Create (disabled)
            </Button>
          </div>
          {state.status !== "idle" && (
            <div className="rounded-md border p-4 text-sm">
              {state.status === "running" && <p>{state.message}</p>}
              {state.status === "error" && <p className="text-red-600">Error: {state.error}</p>}
              {state.status === "done" && (
                <div className="space-y-2">
                  <p className="font-medium">Generation complete.</p>
                  <p>Winner: {state.winner || "(undetermined)"}</p>
                  {state.exportStatuses?.length ? (
                    <div className="space-y-1">
                      <p className="mt-2 font-medium">Artifacts:</p>
                      {state.exportStatuses.map((es, i) => (
                        <div key={i} className="flex items-center justify-between rounded border border-border/40 px-2 py-1 text-xs">
                          <span className="uppercase tracking-wide">{es.artifact}</span>
                          <span className={es.status === 'ok' ? 'text-primary' : es.status === 'skipped' ? 'text-muted-foreground' : 'text-red-500'}>
                            {es.status}{es.fileId ? ` (${es.fileId})` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <p className="text-xs text-muted-foreground">Redirecting to study page...</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
