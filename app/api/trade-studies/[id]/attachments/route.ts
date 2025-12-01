import { NextResponse } from "next/server";

import { attachFileToTradeStudy } from "@/lib/studies";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const { fileId, type, title } = body as { fileId?: string; type?: string; title?: string };

  if (!fileId || !type) {
    return NextResponse.json({ message: "fileId and type are required" }, { status: 400 });
  }

  const attachment = await attachFileToTradeStudy({ tradeStudyId: params.id, fileId, type: type as any, title });
  if (!attachment) {
    return NextResponse.json({ message: "Trade study not found" }, { status: 404 });
  }

  return NextResponse.json({ status: "ok", attachment });
}
