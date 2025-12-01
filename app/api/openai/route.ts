import { NextResponse } from "next/server";

import { generateWithOpenAI } from "@/lib/openai";

export async function POST(req: Request) {
  const body = await req.json();
  const { prompt } = body;

  const message = await generateWithOpenAI(prompt || "Describe the trade study");

  return NextResponse.json({ message });
}
