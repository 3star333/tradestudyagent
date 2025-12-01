import Link from "next/link";
import { ArrowRight, FolderKanban, Link2, PlusCircle, Search, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkGoogleButton } from "@/components/layout/link-google-button";
import { getLinkedGoogleAccount } from "@/lib/google";
import { listTradeStudies } from "@/lib/studies";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getCurrentUser();
  const [studies, googleAccount] = await Promise.all([
    listTradeStudies(session?.user?.id),
    session?.user?.id ? getLinkedGoogleAccount(session.user.id) : null
  ]);

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-10 sm:py-14">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-primary">Workspace</p>
          <h1 className="text-3xl font-semibold">Trade studies</h1>
          <p className="text-muted-foreground">Centralized view of your AI-managed trade studies.</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/trade-studies/search" className="gap-2">
              <Search className="h-4 w-4" />
              Search
            </Link>
          </Button>
          <Button asChild>
            <Link href="/trade-studies/new" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              New study
            </Link>
          </Button>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 className="h-4 w-4" />
            Google OAuth
          </CardTitle>
          <CardDescription>Connect Google account to enable Docs/Sheets/Slides/Drive export.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <LinkGoogleButton label="Link Google Account" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            {googleAccount ? "Linked to Google (tokens stored in Account table)" : "Not linked yet. Tokens will be saved on link."}
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {studies.map((study) => (
          <Card key={study.id} className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FolderKanban className="h-4 w-4" />
                {study.title}
              </CardTitle>
              <CardDescription>{study.summary}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between pt-0">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {study.status.replace("_", " ")}
              </span>
              <Button asChild variant="ghost" size="sm" className="gap-2">
                <Link href={`/trade-studies/${study.id}`}>
                  Open
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
