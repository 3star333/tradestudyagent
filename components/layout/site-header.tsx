import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { AuthActions } from "./auth-actions";

export async function SiteHeader() {
  const session = await getCurrentUser();

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-md shadow-hud">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center gap-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 text-xs font-semibold tracking-[0.25em] uppercase">
          <Link href="/" className="glow-green hover:text-primary transition-colors">
            JET OPS / TRADE STUDY
          </Link>
        </div>
        <nav className="flex flex-1 items-center gap-6 text-xs font-medium text-muted-foreground">
          <Link href="/dashboard" className="hover:text-primary transition-colors">
            Dashboard
          </Link>
          <Link href="/trade-studies/new" className="hover:text-primary transition-colors">
            New Study
          </Link>
          <Link href="/docs" className="hover:text-primary transition-colors">
            Docs
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          {session?.user ? (
            <span className="hidden rounded border border-border/70 bg-secondary/30 px-2 py-1 text-[10px] font-mono text-muted-foreground sm:inline">
              {session.user.email?.split("@")[0] || "pilot"}
            </span>
          ) : null}
          <AuthActions />
        </div>
      </div>
    </header>
  );
}
