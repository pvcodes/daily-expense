import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import type { Transaction } from "./types";
import { contentKey, newId } from "./types";

let sql: NeonQueryFunction<false, false> | null = null;

export function getSql() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}

export async function initSchema() {
  const db = getSql();
  await db.query(`CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    time TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
  // Drop the legacy soft-delete column once and for all: rows are deleted
  // for real now, so any surviving tombstones are purged on migrate.
  await db.query(`DELETE FROM transactions WHERE deleted_at IS NOT NULL`);
  await db.query(`ALTER TABLE transactions DROP COLUMN IF EXISTS deleted_at`);
  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date)`
  );
  await db.query(`CREATE TABLE IF NOT EXISTS user_prefs (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
  // Drop the legacy separate tombstone table (superseded by the soft-delete
  // column, which itself is now gone in favor of hard deletes).
  await db.query(`DROP TABLE IF EXISTS transactions_deleted`);
}

export async function listPrefs(): Promise<Record<string, string>> {
  const db = getSql();
  const rows = (await db`SELECT key, value FROM user_prefs`) as unknown as Array<{
    key: string;
    value: string;
  }>;
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export async function upsertPrefs(pairs: Array<{ key: string; value: string }>) {
  const db = getSql();
  if (pairs.length === 0) return;
  const CHUNK = 100;
  for (let i = 0; i < pairs.length; i += CHUNK) {
    const chunk = pairs.slice(i, i + CHUNK);
    const params: string[] = [];
    const placeholders: string[] = [];
    chunk.forEach((p, j) => {
      const base = j * 2;
      params.push(p.key, p.value);
      placeholders.push(`($${base + 1}::text, $${base + 2}::text, now())`);
    });
    const query =
      `INSERT INTO user_prefs (key, value, updated_at) VALUES ` +
      placeholders.join(", ") +
      ` ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
    await db.query(query, params);
  }
}

interface TxRow {
  id: string;
  date: string;
  time: string | null;
  category: string;
  price: number;
  currency: string | null;
  notes: string | null;
}

function toDateStr(d: unknown): string {
  if (typeof d === "string") return d.slice(0, 10);
  if (d instanceof Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return String(d).slice(0, 10);
}

function rowToTx(row: TxRow): Transaction {
  return {
    id: row.id,
    date: toDateStr(row.date),
    time: row.time || "00:00",
    category: row.category,
    price: row.price,
    currency: row.currency || "INR",
    notes: row.notes || "",
  };
}

export async function listTransactions(): Promise<Transaction[]> {
  const db = getSql();
  const rows = (await db`SELECT id, date, time, category, price, currency, notes
    FROM transactions ORDER BY date DESC, time DESC`) as unknown as TxRow[];
  return rows.map(rowToTx);
}

export async function upsertMany(txs: Transaction[]) {
  const db = getSql();
  if (txs.length === 0) return;
  // Stable-identity model: every row keeps its own id across edits, so an
  // update hits the same row in place (no tombstone + re-insert). Content
  // dedup applies only to rows that don't exist yet, so re-importing a file
  // never creates copies.
  const byContent = new Map<string, Transaction>();
  for (const t of txs) {
    const norm: Transaction = {
      ...t,
      id: t.id || newId(),
      time: t.time || "00:00",
      currency: t.currency || "INR",
      notes: t.notes || "",
    };
    const key = contentKey(norm);
    if (!byContent.has(key)) byContent.set(key, norm);
  }
  let toWrite = [...byContent.values()];

  const ids = toWrite.map((t) => t.id);
  const existing = new Set(
    (
      (await db`SELECT id FROM transactions WHERE id = ANY(${ids})`) as unknown as Array<{
        id: string;
      }>
    ).map((r) => r.id)
  );

  const fresh = toWrite.filter((t) => !existing.has(t.id));
  if (fresh.length > 0) {
    const contentRows = (await db`
      SELECT date::text || '|' || time || '|' || category || '|' || price::text || '|' || currency || '|' || notes AS ck
      FROM transactions`) as unknown as Array<{ ck: string }>;
    const liveContent = new Set(contentRows.map((r) => r.ck));
    toWrite = toWrite.filter(
      (t) => existing.has(t.id) || !liveContent.has(contentKey(t))
    );
  }
  if (toWrite.length === 0) return;

  const CHUNK = 100;
  for (let i = 0; i < toWrite.length; i += CHUNK) {
    const chunk = toWrite.slice(i, i + CHUNK);
    const params: (string | number)[] = [];
    const placeholders: string[] = [];
    chunk.forEach((t, j) => {
      const base = j * 7;
      params.push(
        t.id,
        t.date,
        t.time,
        t.category,
        t.price,
        t.currency,
        t.notes
      );
      placeholders.push(
        `($${base + 1}::text, $${base + 2}::date, $${base + 3}::text, $${base + 4}::text, $${base + 5}::double precision, $${base + 6}::text, $${base + 7}::text, now())`
      );
    });
    const query =
      `INSERT INTO transactions (id, date, time, category, price, currency, notes, updated_at) VALUES ` +
      placeholders.join(", ") +
      ` ON CONFLICT (id) DO UPDATE SET
        date = EXCLUDED.date,
        time = EXCLUDED.time,
        category = EXCLUDED.category,
        price = EXCLUDED.price,
        currency = EXCLUDED.currency,
        notes = EXCLUDED.notes,
        updated_at = now()`;
    await db.query(query, params);
  }
}

export async function deleteTransactions(ids: string[]) {
  const db = getSql();
  if (ids.length === 0) return;
  const params: string[] = [];
  const placeholders = ids.map((id, i) => {
    params.push(id);
    return `$${i + 1}::text`;
  });
  await db.query(
    `DELETE FROM transactions WHERE id IN (${placeholders.join(", ")})`,
    params
  );
}

export async function clearAllTransactions() {
  const db = getSql();
  await db`DELETE FROM transactions`;
}

export async function countTransactions(): Promise<number> {
  const db = getSql();
  const rows = (await db`SELECT COUNT(*)::int AS n FROM transactions`) as unknown as Array<{
    n: number;
  }>;
  return rows[0]!.n;
}