import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await verifyCronSecret(request))) return NextResponse.json({ error: "Cron authentication failed." }, { status: 401 });
  try {
    const result = await query<{ generated: number }>(
      "SELECT tracker_process_due_recurring(NOW())::int AS generated"
    );
    return NextResponse.json({ ok: true, generated: result.rows[0]?.generated || 0 });
  } catch {
    return NextResponse.json({ error: "Recurring expenses could not be processed." }, { status: 500 });
  }
}
