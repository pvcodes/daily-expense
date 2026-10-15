import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireSession();
    const result = await query<{
      id: string;
      request_id: string | null;
      source: "vercel_cron" | "http";
      status: "running" | "succeeded" | "failed";
      started_at: string;
      completed_at: string | null;
      duration_ms: number | null;
      generated_count: number | null;
      error_name: string | null;
      error_code: string | null;
    }>(
      "SELECT id, request_id, source, status, started_at, completed_at, duration_ms, generated_count, error_name, error_code " +
      "FROM tracker_cron_runs ORDER BY started_at DESC, id DESC LIMIT 30"
    );
    return NextResponse.json({ runs: result.rows });
  } catch (error) {
    const status = (error as { status?: number }).status || 500;
    return NextResponse.json({ error: status === 401 ? "Sign in again." : "Could not load cron run history." }, { status });
  }
}
