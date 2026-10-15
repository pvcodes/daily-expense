import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireSession();
    return NextResponse.json({ authenticated: true });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
