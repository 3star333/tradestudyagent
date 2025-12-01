import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const nextAuthUrl = `/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  return NextResponse.redirect(new URL(nextAuthUrl, request.url));
}
