import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = request.headers.get("x-vercel-id") || randomUUID();
  if (!(await verifyCronSecret(request))) {
    console.warn(JSON.stringify({
      event: "recurring_cron_auth_rejected",
      requestId,
      occurredAt: new Date().toISOString(),
      reason: process.env.CRON_SECRET ? "authorization_rejected" : "cron_secret_not_configured"
    }));
    return NextResponse.json({ error: "Cron authentication failed." }, { status: 401 });
  }

  const startedAt = Date.now();
  const userAgent = request.headers.get("user-agent") || "";
  console.info(JSON.stringify({
    event: "recurring_cron_started",
    requestId,
    startedAt: new Date(startedAt).toISOString(),
    source: /vercel-cron\/1\.0/i.test(userAgent) ? "vercel_cron" : "http"
  }));

  try {
    const result = await query<{ generated: number }>(
      "SELECT tracker_process_due_recurring(NOW())::int AS generated"
    );
    const generated = result.rows[0]?.generated || 0;
    console.info(JSON.stringify({
      event: "recurring_cron_completed",
      requestId,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      generated
    }));
    return NextResponse.json({ ok: true, generated });
  } catch (error) {
    const errorCode = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
      ? error.code
      : undefined;
    console.error(JSON.stringify({
      event: "recurring_cron_failed",
      requestId,
      failedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      errorName: error instanceof Error ? error.name : "UnknownError",
      ...(errorCode ? { errorCode } : {})
    }));
    return NextResponse.json({ error: "Recurring expenses could not be processed." }, { status: 500 });
  }
}
