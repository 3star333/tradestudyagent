import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { listDriveFiles } from "@/lib/google";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const listing = await listDriveFiles(userId);
  return NextResponse.json(listing);
}
