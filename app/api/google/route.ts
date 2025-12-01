import { NextResponse } from "next/server";

import { exportToDocs } from "@/lib/google";

export async function POST(req: Request) {
  const body = await req.json();
  const { tradeStudyId, payload } = body;

  const response = await exportToDocs({ tradeStudyId, payload });

  return NextResponse.json(response);
}
