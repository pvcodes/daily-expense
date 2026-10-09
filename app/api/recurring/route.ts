import { NextResponse } from "next/server";
import {
  initSchemaOnce,
  listRecurring,
  upsertRecurring,
  deleteRecurring,
  applyRecurring,
} from "@/lib/db";
import { sessionUserId } from "@/lib/auth";
import { newId, type RecurringRule } from "@/lib/types";

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

async function ensureSchema() {
  try {
    await initSchemaOnce();
  } catch {
    // schema race between cold starts is fine
  }
}

export async function GET(request: Request) {
  const userId = await sessionUserId(request);
  if (!userId) return unauthorized();
  try {
    await ensureSchema();
    const rules = await listRecurring(userId);
    return NextResponse.json({ rules });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = await sessionUserId(request);
  if (!userId) return unauthorized();
  try {
    const body = await request.json();
    const rules: RecurringRule[] = Array.isArray(body)
      ? body
      : Array.isArray(body?.rules)
        ? body.rules
        : body && typeof body === "object" && body.category
          ? [body as RecurringRule]
          : [];
    if (rules.length === 0) {
      return NextResponse.json({ error: "No rules provided" }, { status: 400 });
    }
    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
    for (const r of rules) {
      if (
        typeof r.category !== "string" ||
        r.category.length > 100 ||
        typeof r.price !== "number" ||
        !Number.isFinite(r.price) ||
        typeof r.notes !== "string" ||
        r.notes.length > 2000 ||
        (r.frequency !== "monthly" && r.frequency !== "yearly") ||
        typeof r.startDate !== "string" ||
        !DATE_RE.test(r.startDate)
      ) {
        return NextResponse.json(
          { error: "Invalid rule. Need category, price, frequency, startDate" },
          { status: 400 }
        );
      }
    }
    await ensureSchema();
    for (const r of rules) {
      await upsertRecurring(userId, {
        id: typeof r.id === "string" && r.id ? r.id : newId(),
        category: r.category,
        price: r.price,
        notes: r.notes || "",
        frequency: r.frequency,
        startDate: r.startDate,
        time: typeof r.time === "string" && r.time ? r.time : "00:00",
        lastGenerated: typeof r.lastGenerated === "string" ? r.lastGenerated : null,
        includeInAnalysis: r.includeInAnalysis === true,
        paused: r.paused === true,
      });
    }
    // Materialize any already-due occurrences right away.
    await applyRecurring(userId);
    const out = await listRecurring(userId);
    return NextResponse.json({ ok: true, rules: out });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const userId = await sessionUserId(request);
  if (!userId) return unauthorized();
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id || id.length > 64) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    await ensureSchema();
    await deleteRecurring(userId, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
