import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { getLinkedGoogleAccount } from "@/lib/google";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ isLinked: false, message: "Not authenticated" }, { status: 401 });
  }

  const account = await getLinkedGoogleAccount(session.user.id);
  return NextResponse.json({ isLinked: !!account, accountId: account?.id, scope: account?.scope });
}
