import { NextResponse } from "next/server";
import { createSession, loginKey, passwordMatches, validateSameOrigin } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await validateSameOrigin(request))) return NextResponse.json({ error: "Request origin rejected." }, { status: 403 });
  try {
    if (!process.env.TRACKER_PASSWORD || !process.env.SESSION_SECRET) {
      return NextResponse.json({ error: "Set TRACKER_PASSWORD and SESSION_SECRET in the deployment environment." }, { status: 503 });
    }
    const body = await request.json();
    const password = typeof body.password === "string" ? body.password : "";
    const key = await loginKey();
    const attempt = await query<{ attempts: number; locked_until: string | null }>(
      "SELECT attempts, locked_until FROM tracker_login_attempts WHERE key_hash = $1",
      [key]
    );
    const row = attempt.rows[0];
    if (row?.locked_until && new Date(row.locked_until).getTime() > Date.now()) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    if (!passwordMatches(password)) {
      await query(
        "INSERT INTO tracker_login_attempts(key_hash, attempts, window_started_at, locked_until) " +
        "VALUES ($1, 1, NOW(), NULL) " +
        "ON CONFLICT (key_hash) DO UPDATE SET " +
        "attempts = CASE WHEN tracker_login_attempts.window_started_at < NOW() - INTERVAL '15 minutes' THEN 1 ELSE tracker_login_attempts.attempts + 1 END, " +
        "window_started_at = CASE WHEN tracker_login_attempts.window_started_at < NOW() - INTERVAL '15 minutes' THEN NOW() ELSE tracker_login_attempts.window_started_at END, " +
        "locked_until = CASE WHEN (CASE WHEN tracker_login_attempts.window_started_at < NOW() - INTERVAL '15 minutes' THEN 1 ELSE tracker_login_attempts.attempts + 1 END) >= 5 THEN NOW() + INTERVAL '15 minutes' ELSE NULL END",
        [key]
      );
      return NextResponse.json({ error: "That password did not match." }, { status: 401 });
    }

    await query("DELETE FROM tracker_login_attempts WHERE key_hash = $1", [key]);
    await createSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login is unavailable.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
