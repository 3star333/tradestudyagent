"use client";

import { useEffect, useState } from "react";
import { Link as LinkIcon, Loader2, Plus, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TradeStudyAttachment } from "@/lib/studies";
import { cn } from "@/lib/utils";

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
};

const attachmentOptions: { value: TradeStudyAttachment["type"]; label: string }[] = [
  { value: "doc", label: "Google Doc" },
  { value: "sheet", label: "Google Sheet" },
  { value: "slide", label: "Google Slide" },
  { value: "drive", label: "Drive File" }
];

export function AttachmentPanel({
  tradeStudyId,
  initial,
  googleLinked
}: {
  tradeStudyId: string;
  initial?: TradeStudyAttachment[];
  googleLinked?: boolean;
}) {
  const [attachments, setAttachments] = useState<TradeStudyAttachment[]>(initial || []);
  const [fileId, setFileId] = useState("");
  const [type, setType] = useState<TradeStudyAttachment["type"]>("doc");
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [requiresLink, setRequiresLink] = useState(!googleLinked);

  useEffect(() => {
    if (initial?.length) {
      setAttachments(initial);
    }
  }, [initial]);

  async function handleAttach(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!fileId) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/trade-studies/${tradeStudyId}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, type, title })
      });
      if (!res.ok) {
        throw new Error("Failed to save attachment");
      }
      const data = await res.json();
      if (data?.attachment) {
        setAttachments((prev) => [...prev, data.attachment]);
        setFileId("");
        setTitle("");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function loadDriveFiles() {
    setLoadingDrive(true);
    try {
      const res = await fetch("/api/google/files");
      if (!res.ok) throw new Error("Drive files failed");
      const data = await res.json();
      setDriveFiles(data.files || []);
      setRequiresLink(Boolean(data.requiresLink));
    } finally {
      setLoadingDrive(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">Attachments</CardTitle>
        <CardDescription>Link Google Docs/Sheets/Slides/Drive IDs to this trade study.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={handleAttach}>
          <div className="grid gap-2">
            <Label htmlFor="fileId">Google file ID</Label>
            <Input
              id="fileId"
              placeholder="1AbCdeFg..."
              value={fileId}
              onChange={(e) => setFileId(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">Paste the ID from Docs, Sheets, Slides, or Drive.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="title">Label (optional)</Label>
            <Input
              id="title"
              placeholder="Decision doc"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">File type</Label>
            <div className="flex flex-wrap gap-2">
              {attachmentOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm transition-colors",
                    type === option.value ? "border-primary bg-primary/10 text-primary" : "border-input hover:bg-accent"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" className="gap-2" disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Save attachment
          </Button>
        </form>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Linked files</h3>
            <Button variant="outline" size="sm" className="gap-2" type="button" onClick={loadDriveFiles} disabled={loadingDrive}>
              {loadingDrive ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Load Drive files (stub)
            </Button>
          </div>
          {requiresLink ? (
            <p className="text-xs text-destructive">
              Google not linked. Use the “Link Google Account” button above to fetch real files.
            </p>
          ) : null}
          <div className="space-y-2">
            {attachments?.length ? (
              attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{att.title || att.fileId}</p>
                    <p className="text-xs text-muted-foreground">
                      {att.type.toUpperCase()} • {att.fileId}
                    </p>
                  </div>
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No attachments yet.</p>
            )}
          </div>
        </div>

        {driveFiles.length ? (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Drive files (sample)</h4>
            <div className="space-y-2">
              {driveFiles.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => setFileId(file.id)}
                  className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:border-primary"
                >
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.mimeType}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">Use ID</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
