import Link from "next/link";
import { FileSpreadsheet, PenSquare, ShieldCheck } from "lucide-react";

import { LinkGoogleButton } from "@/components/layout/link-google-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const session = await getCurrentUser();

  return (
    <section className="mx-auto flex max-w-screen-xl flex-col gap-10 px-4 py-12 sm:py-16 lg:py-24">
      <header className="grid gap-6 md:grid-cols-[1.25fr_1fr] md:items-center">
        <div className="space-y-6">
          <p className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            Early stage scaffold
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Trade Study Agent
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Bootstrap for an AI-powered workspace that compares vendors, captures decisions, and publishes artifacts to Google Docs, Sheets, Slides, and Drive.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={session?.user ? "/dashboard" : "/login"}>
                {session?.user ? "Go to dashboard" : "Sign in to start"}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/trade-studies/new">Create a trade study</Link>
            </Button>
            <LinkGoogleButton label="Link Google" />
          </div>
        </div>
        <div className="grid gap-4 rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Session</span>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
              {session?.user ? "Authenticated" : "Anonymous"}
            </span>
          </div>
          <div className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
            {session?.user ? (
              <ul className="space-y-2">
                <li>
                  <strong>User:</strong> {session.user.name}
                </li>
                <li>
                  <strong>Email:</strong> {session.user.email}
                </li>
                <li>
                  <strong>User ID:</strong> {session.user.id}
                </li>
              </ul>
            ) : (
              <p>Sign in with Google to link studies to your account.</p>
            )}
          </div>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenSquare className="h-5 w-5" />
              Capture decisions
            </CardTitle>
            <CardDescription>
              Store trade study JSON as the single source of truth for requirements, options, scoring, and rationale.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Prisma-backed models keep AI agent outputs, user edits, and publication targets in sync.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Publish to Google
            </CardTitle>
            <CardDescription>
              Service stubs for Docs, Sheets, Slides, and Drive ready for credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Wire agent prompts to generate and push materials to a shared Drive folder.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Opinionated defaults
            </CardTitle>
            <CardDescription>
              NextAuth with Google, Prisma, Tailwind, ShadCN UI, and Lucide icons ready for Vercel.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Swap stubs for real logic without restructuring the app router.
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
