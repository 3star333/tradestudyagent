import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { AuthActions } from "./auth-actions";

export async function SiteHeader() {
  const session = await getCurrentUser();

  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em]">
          <Link href="/" className="hover:text-primary">
            Trade Study Agent
          </Link>
        </div>
        <nav className="flex flex-1 items-center gap-4 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
          <Link href="/trade-studies/new" className="hover:text-foreground">
            New Study
          </Link>
          <Link href="/docs" className="hover:text-foreground">
            Docs (stub)
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          {session?.user ? (
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {session.user.email}
            </span>
          ) : null}
          <AuthActions />
        </div>
      </div>
    </header>
  );
}
