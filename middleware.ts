import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: Request) {
  const url = new URL(req.url);
  const isProtected = [/^\/dashboard(\/|$)/, /^\/trade-studies(\/|$)/].some((re) => re.test(url.pathname));
  if (!isProtected) return NextResponse.next();

  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("callbackUrl", url.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/trade-studies/:path*"]
};
