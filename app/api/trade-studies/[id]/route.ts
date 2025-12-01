import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { getTradeStudyById, updateTradeStudy } from "@/lib/studies";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const study = await getTradeStudyById(params.id);
  if (!study) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json(study);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const payload = typeof body?.data === "string" ? JSON.parse(body.data) : body?.data || {};

  const updated = await updateTradeStudy({
    tradeStudyId: params.id,
    title: body.title,
    summary: body.summary,
    status: body.status,
    data: payload
  });

  return NextResponse.json(updated);
}
