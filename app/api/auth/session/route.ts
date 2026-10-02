import { NextResponse } from "next/server";
import { sessionUserId } from "@/lib/auth";

/** Who the current cookie belongs to, so the UI can say so. */
export async function GET(request: Request) {
  const userId = await sessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ user: userId });
}