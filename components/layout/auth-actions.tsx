"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { LogIn, LogOut, UserCircle2 } from "lucide-react";

import { Button } from "../ui/button";

export function AuthActions() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (!session?.user) {
    return (
      <Button variant="secondary" size="sm" onClick={() => signIn("google")}
        className="gap-2">
        <LogIn className="h-4 w-4" />
        Sign in with Google
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
        Hi, {session.user.name || "user"}
      </Link>
      <Button variant="ghost" size="sm" onClick={() => signOut()} className="gap-2">
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </div>
  );
}
