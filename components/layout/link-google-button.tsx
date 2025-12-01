"use client";

import { Link2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getGoogleAuthUrl } from "@/lib/google";

export function LinkGoogleButton({ label = "Link Google Account" }: { label?: string }) {
  const searchParams = useSearchParams();
  const callback = searchParams.get("callbackUrl") || "/dashboard";
  const href = getGoogleAuthUrl(callback);

  return (
    <Button asChild variant="secondary" className="gap-2">
      <a href={href}>
        <Link2 className="h-4 w-4" />
        {label}
      </a>
    </Button>
  );
}
