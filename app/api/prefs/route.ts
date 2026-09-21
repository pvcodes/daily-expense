import { NextResponse } from "next/server";
import {
  initSchema,
  listPrefs,
  upsertPrefs,
} from "@/lib/db";

const ALLOWED_KEYS = new Set([
  "expense-tracker.period",
  "expense-tracker.txns.cat",
  "expense-tracker.txns.search",
  "expense-tracker.weekStart",
  "expense-tracker.accent",
  "expense-tracker.budget.v1",
]);

const MAX_VALUE = 2000;

async function ensureSchema() {
  try {
    await initSchema();
  } catch {
    // schema race between cold starts is fine
  }
}

export async function GET() {
  try {
    await ensureSchema();
    const prefs = await listPrefs();
    return NextResponse.json({ prefs });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const pairs = Array.isArray(body?.prefs)
      ? body.prefs
      : body?.key !== undefined && body?.value !== undefined
      ? [body]
      : [];
    if (pairs.length === 0) {
      return NextResponse.json({ error: "No preferences provided" }, { status: 400 });
    }
    if (pairs.length > 50) {
      return NextResponse.json({ error: "Too many preferences" }, { status: 413 });
    }
    const clean: Array<{ key: string; value: string }> = [];
    for (const p of pairs) {
      const key = p?.key;
      const value = p?.value;
      if (
        typeof key !== "string" ||
        !ALLOWED_KEYS.has(key) ||
        typeof value !== "string" ||
        value.length > MAX_VALUE
      ) {
        return NextResponse.json(
          { error: `Invalid preference: ${JSON.stringify(p)}` },
          { status: 400 }
        );
      }
      clean.push({ key, value });
    }
    await ensureSchema();
    await upsertPrefs(clean);
    return NextResponse.json({ ok: true, saved: clean.length });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
