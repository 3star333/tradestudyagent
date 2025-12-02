import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { generateTradeStudy, GenerationInputSchema } from "../../../../lib/tradeStudyGenerator";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const parsed = GenerationInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
    }
    const result = await generateTradeStudy(session.user.id, parsed.data);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("[generate POST] error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
