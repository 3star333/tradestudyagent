import { NextResponse } from "next/server";

import { attachFileToTradeStudy } from "@/lib/studies";
import { TradeStudyAttachmentType } from "@prisma/client";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const { fileId, type, title } = body as { fileId?: string; type?: TradeStudyAttachmentType | string; title?: string };

  if (!fileId || !type) {
    return NextResponse.json({ message: "fileId and type are required" }, { status: 400 });
  }

  // Validate type against enum keys
  const normalizedType = typeof type === "string" ? type.toLowerCase() : type;
  const validTypes = Object.values(TradeStudyAttachmentType).map((v) => v.toLowerCase());
  if (typeof normalizedType !== "string" || !validTypes.includes(normalizedType)) {
    return NextResponse.json({ message: `Invalid type. Must be one of: ${validTypes.join(", ")}` }, { status: 400 });
  }
  const enumValue = TradeStudyAttachmentType[Object.keys(TradeStudyAttachmentType).find(k => TradeStudyAttachmentType[k as keyof typeof TradeStudyAttachmentType].toLowerCase() === normalizedType)! as keyof typeof TradeStudyAttachmentType];

  const attachment = await attachFileToTradeStudy({ tradeStudyId: params.id, fileId, type: enumValue, title });
  if (!attachment) {
    return NextResponse.json({ message: "Trade study not found" }, { status: 404 });
  }

  return NextResponse.json({ status: "ok", attachment });
}
