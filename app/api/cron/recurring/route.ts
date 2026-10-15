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
  const runId = randomUUID();
  const userAgent = request.headers.get("user-agent") || "";
  const source = /vercel-cron\/1\.0/i.test(userAgent) ? "vercel_cron" : "http";
  console.info(JSON.stringify({
    event: "recurring_cron_started",
    runId,
    requestId,
    startedAt: new Date(startedAt).toISOString(),
    source
  }));

  try {
    await query(
      "INSERT INTO tracker_cron_runs (id, request_id, source, status) VALUES ($1, $2, $3, 'running')",
      [runId, requestId, source]
    );
  } catch (error) {
    console.error(JSON.stringify({
      event: "recurring_cron_log_write_failed",
      runId,
      requestId,
      failedAt: new Date().toISOString(),
      errorName: error instanceof Error ? error.name : "UnknownError"
    }));
    return NextResponse.json({ error: "Could not record recurring job run." }, { status: 500 });
  }

  let generated: number;
  try {
    const result = await query<{ generated: number }>(
      "SELECT tracker_process_due_recurring(NOW())::int AS generated"
    );
    generated = result.rows[0]?.generated || 0;
  } catch (error) {
    const errorCode = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
      ? error.code
      : null;
    const errorName = error instanceof Error ? error.name : "UnknownError";
    let logUpdateFailed = false;
    try {
      await query(
        "UPDATE tracker_cron_runs SET status='failed', completed_at=NOW(), duration_ms=$2, error_name=$3, error_code=$4 WHERE id=$1",
        [runId, Date.now() - startedAt, errorName, errorCode]
      );
    } catch {
      logUpdateFailed = true;
    }
    console.info(JSON.stringify({
      event: "recurring_cron_failed",
      runId,
      requestId,
      failedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      errorName,
      ...(errorCode ? { errorCode } : {}),
      logUpdateFailed
    }));
    if (logUpdateFailed) console.error(JSON.stringify({ event: "recurring_cron_result_write_failed", runId, requestId }));
    return NextResponse.json({ error: "Recurring expenses could not be processed." }, { status: 500 });
  }

  try {
    await query(
      "UPDATE tracker_cron_runs SET status='succeeded', completed_at=NOW(), duration_ms=$2, generated_count=$3 WHERE id=$1",
      [runId, Date.now() - startedAt, generated]
    );
  } catch (error) {
    console.error(JSON.stringify({
      event: "recurring_cron_result_write_failed",
      runId,
      requestId,
      errorName: error instanceof Error ? error.name : "UnknownError"
    }));
    return NextResponse.json({ error: "Recurring run completed but its result could not be recorded." }, { status: 500 });
  }

  console.info(JSON.stringify({
    event: "recurring_cron_completed",
    runId,
    requestId,
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    generated
  }));
  return NextResponse.json({ ok: true, generated, runId });
}
