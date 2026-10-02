import { NextResponse } from "next/server";
import {
  initSchemaOnce,
  listTransactions,
  upsertMany,
  deleteTransactions,
  clearAllTransactions,
  countTransactions,
  seedCustomCategories,
  applyRecurring,
} from "@/lib/db";
import { sessionUserId } from "@/lib/auth";
import type { Transaction } from "@/lib/types";

async function ensureSchema() {
  try {
    await initSchemaOnce();
  } catch {
    // schema race between cold starts is fine; queries will still work
  }
}

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

/**
 * Adopting the categories already in the ledger as user-added ones is a
 * one-shot per user: seedCustomCategories checks for its own marker row, so
 * repeat calls cost one indexed lookup and then do nothing.
 */
async function seedCategories(userId: string) {
  try {
    await seedCustomCategories(userId);
  } catch {
    // non-fatal: the client still falls back to the defaults
  }
}

export async function GET(request: Request) {
  const userId = await sessionUserId(request);
  if (!userId) return unauthorized();
  try {
    await ensureSchema();
    await Promise.all([
      seedCategories(userId),
      applyRecurring(userId).catch(() => {
        // non-fatal: recurring catch-up must never break listing
      }),
    ]);
    const [txs, count] = await Promise.all([
      listTransactions(userId),
      countTransactions(userId),
    ]);
    return NextResponse.json({ transactions: txs, count });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const userId = await sessionUserId(request);
  if (!userId) return unauthorized();
  try {
    const body = await request.json();
    const txs: Transaction[] = Array.isArray(body)
      ? body
      : Array.isArray(body?.transactions)
      ? body.transactions
      : [];
    const deleteIds: unknown[] = Array.isArray(body?.deleteIds) ? body.deleteIds : [];
    if (txs.length === 0 && deleteIds.length === 0) {
      return NextResponse.json({ error: "No transactions provided" }, { status: 400 });
    }
    if (txs.length > 20000 || deleteIds.length > 20000) {
      return NextResponse.json({ error: "Too many transactions" }, { status: 413 });
    }
    for (const id of deleteIds) {
      if (typeof id !== "string" || id.length > 64) {
        return NextResponse.json(
          { error: "Invalid deleteIds" },
          { status: 400 }
        );
      }
    }
    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
    const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d/;
    for (const t of txs) {
      if (
        typeof t.id !== "string" ||
        t.id.length > 64 ||
        typeof t.date !== "string" ||
        !DATE_RE.test(t.date) ||
        typeof t.time !== "string" ||
        !TIME_RE.test(t.time) ||
        typeof t.category !== "string" ||
        t.category.length > 100 ||
        typeof t.price !== "number" ||
        !Number.isFinite(t.price) ||
        typeof t.currency !== "string" ||
        t.currency.length > 8 ||
        typeof t.notes !== "string" ||
        t.notes.length > 2000
      ) {
        return NextResponse.json(
          { error: "Invalid transaction shape. Need id, date, category, price" },
          { status: 400 }
        );
      }
    }
    const delSet = new Set(deleteIds as string[]);
    const toUpsert = txs.filter((t) => !delSet.has(t.id));
    await ensureSchema();
    await upsertMany(userId, toUpsert);
    await deleteTransactions(userId, deleteIds as string[]);
    const count = await countTransactions(userId);
    return NextResponse.json({ ok: true, count, upserted: txs.length });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const userId = await sessionUserId(request);
  if (!userId) return unauthorized();
  try {
    await ensureSchema();
    await clearAllTransactions(userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}