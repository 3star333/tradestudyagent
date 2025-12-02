"use client";

import { Link2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { getGoogleAuthUrl } from "@/lib/google";

export function LinkGoogleButton({ label = "Link Google Account" }: { label?: string }) {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const callback = searchParams.get("callbackUrl") || "/dashboard";
  const linked = Boolean(session?.user?.googleLinked);

  return (
    <Button
      variant={linked ? "outline" : "secondary"}
      className="gap-2"
      disabled={status === "loading" || linked}
  onClick={() => !linked && signIn("google", { callbackUrl: callback, prompt: "consent" })}
    >
      <Link2 className="h-4 w-4" />
      {linked ? "Google Linked" : label}
    </Button>
  );
}
