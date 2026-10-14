import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireSession();
    const result = await query(
      "SELECT id, name, icon, color FROM tracker_categories WHERE archived = FALSE ORDER BY name"
    );
    return NextResponse.json({ categories: result.rows });
  } catch (error) {
    const status = (error as { status?: number }).status || 500;
    return NextResponse.json({ error: status === 401 ? "Sign in again." : "Could not load categories." }, { status });
  }
}
