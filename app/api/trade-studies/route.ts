import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { createTradeStudy, listTradeStudies } from "@/lib/studies";

export async function GET() {
  const session = await getServerSession(authOptions);
  const studies = await listTradeStudies(session?.user?.id);
  return NextResponse.json(studies);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const payload = typeof body?.data === "string" ? JSON.parse(body.data) : body?.data || {};

  const study = await createTradeStudy({
    ownerId: session.user.id,
    title: body.title || "Untitled trade study",
    summary: body.summary,
    status: body.status,
    data: payload
  });

  return NextResponse.json(study);
}
