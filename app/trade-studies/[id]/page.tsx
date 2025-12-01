import { notFound } from "next/navigation";
import { BarChart3, FileText, Link2 } from "lucide-react";

import { AgentRunner } from "@/components/trade-studies/agent-runner";
import { AttachmentPanel } from "@/components/trade-studies/attachment-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkGoogleButton } from "@/components/layout/link-google-button";
import { getLinkedGoogleAccount } from "@/lib/google";
import { getTradeStudyById } from "@/lib/studies";
import { getCurrentUser } from "@/lib/auth";

export default async function TradeStudyDetail({ params }: { params: { id: string } }) {
  const [study, session] = await Promise.all([getTradeStudyById(params.id), getCurrentUser()]);

  if (!study) {
    return notFound();
  }
  const googleAccount = session?.user?.id ? await getLinkedGoogleAccount(session.user.id) : null;

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-10 sm:py-14">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-primary">Trade study</p>
          <h1 className="text-3xl font-semibold">{study.title}</h1>
          <p className="text-muted-foreground">{study.summary}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Score
          </Button>
          <LinkGoogleButton label="Link Google" />
        </div>
      </div>

      <div className="mt-8 grid gap-4">
        <AgentRunner tradeStudyId={study.id} />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trade study JSON</CardTitle>
            <CardDescription>Single source of truth stored in Postgres via Prisma.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[320px] overflow-auto rounded-md bg-muted p-4 text-xs text-foreground">
{JSON.stringify(study.data, null, 2)}
            </pre>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-4 w-4" />
              Publish targets
            </CardTitle>
            <CardDescription>Docs, Sheets, Slides, and Drive integration stubs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Use the Google service in <code className="rounded bg-muted px-2 py-1">lib/google.ts</code> to push generated outputs.</p>
            <p>Use the OpenAI service in <code className="rounded bg-muted px-2 py-1">lib/openai.ts</code> for agent prompts.</p>
            <div className="flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              <Link2 className="h-4 w-4" />
              OAuth starts at /auth/google and tokens are stored in the Account table.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-4">
        <AttachmentPanel tradeStudyId={study.id} initial={study.attachments} googleLinked={!!googleAccount} />
      </div>
    </div>
  );
}
