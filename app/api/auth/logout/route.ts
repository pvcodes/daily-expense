import { NextResponse } from "next/server";
import { destroySession, requireSession, validateSameOrigin } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await validateSameOrigin(request))) return NextResponse.json({ error: "Request origin rejected." }, { status: 403 });
  try {
    await requireSession();
    await destroySession();
    return NextResponse.json({ ok: true });
  } catch {
    await destroySession();
    return NextResponse.json({ ok: true });
  }
}
