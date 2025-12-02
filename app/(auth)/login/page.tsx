"use client";

import { signIn } from "next-auth/react";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Use Google OAuth to access your trade studies and agent features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full gap-2"
          >
            <LogIn className="h-4 w-4" />
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
