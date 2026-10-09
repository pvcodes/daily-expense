import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import type { RecurringRule, Transaction } from "./types";
import {
  contentKey,
  newId,
  CUSTOM_CATEGORIES_KEY,
  isDefaultCategory,
} from "./types";

let sql: NeonQueryFunction<false, false> | null = null;

// initSchema is ~15 DDL round trips; running it on every API request makes
// the initial ledger fetch painfully slow. Memoize per server process and
// only retry when it actually failed.
let schemaPromise: Promise<void> | null = null;

export function initSchemaOnce(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = initSchema().catch((e) => {
      schemaPromise = null;
      throw e;
    });
  }
  return schemaPromise;
}

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
  // Every row is scoped by user_id: ids are only unique per user, so both
  // tables key on (user_id, …). The DEFAULT keeps single-user installs working
  // and gives legacy rows an owner when the column is added below.
  await db.query(`CREATE TABLE IF NOT EXISTS transactions (
    user_id TEXT NOT NULL DEFAULT 'me',
    id TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
  // Multi-user migration (idempotent): claim pre-existing rows as `me`, then
  // swap the single-column PKs for per-user composite ones.
  await db.query(
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'me'`
  );
  await db.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS include_in_analysis BOOLEAN NOT NULL DEFAULT TRUE`);
  await db.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recurring_rule_id TEXT`);
  await db.query(
    `UPDATE transactions SET user_id = 'me' WHERE user_id IS NULL OR user_id = ''`
  );
  await db.query(`ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_pkey`);
  await db.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions (user_id, id)`
  );
  await db.query(`DROP INDEX IF EXISTS idx_transactions_date`);
  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions (user_id, date)`
  );
  await db.query(`CREATE TABLE IF NOT EXISTS recurring (
    user_id TEXT NOT NULL DEFAULT 'me',
    id TEXT NOT NULL,
    category TEXT NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    frequency TEXT NOT NULL,
    start_date DATE NOT NULL,
    time TEXT NOT NULL DEFAULT '00:00',
    last_generated DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
  await db.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_recurring_user_id ON recurring (user_id, id)`
  );
  await db.query(`ALTER TABLE recurring ADD COLUMN IF NOT EXISTS include_in_analysis BOOLEAN NOT NULL DEFAULT FALSE`);
  await db.query(`ALTER TABLE recurring ADD COLUMN IF NOT EXISTS paused BOOLEAN NOT NULL DEFAULT FALSE`);
  await db.query(`CREATE TABLE IF NOT EXISTS user_prefs (
    user_id TEXT NOT NULL DEFAULT 'me',
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
  await db.query(
    `ALTER TABLE user_prefs ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'me'`
  );
  await db.query(
    `UPDATE user_prefs SET user_id = 'me' WHERE user_id IS NULL OR user_id = ''`
  );
  await db.query(`ALTER TABLE user_prefs DROP CONSTRAINT IF EXISTS user_prefs_pkey`);
  await db.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_user_prefs_user_key ON user_prefs (user_id, key)`
  );

  // Legacy cleanup, last and best-effort: these reference columns/tables that
  // earlier versions may already have dropped, and must never abort the
  // migrations above.
  await db
    .query(`DELETE FROM transactions WHERE deleted_at IS NOT NULL`)
    .catch(() => {});
  await db.query(`ALTER TABLE transactions DROP COLUMN IF EXISTS deleted_at`);
  await db.query(`DROP TABLE IF EXISTS transactions_deleted`);
}

export async function listPrefs(userId: string): Promise<Record<string, string>> {
  const db = getSql();
  const rows = (await db`SELECT key, value FROM user_prefs WHERE user_id = ${userId}`) as unknown as Array<{
    key: string;
    value: string;
  }>;
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export async function upsertPrefs(
  userId: string,
  pairs: Array<{ key: string; value: string }>
) {
  const db = getSql();
  if (pairs.length === 0) return;
  const CHUNK = 100;
  for (let i = 0; i < pairs.length; i += CHUNK) {
    const chunk = pairs.slice(i, i + CHUNK);
    const params: string[] = [];
    const placeholders: string[] = [];
    chunk.forEach((p, j) => {
      const base = j * 3;
      params.push(userId, p.key, p.value);
      placeholders.push(
        `($${base + 1}::text, $${base + 2}::text, $${base + 3}::text, now())`
      );
    });
    const query =
      `INSERT INTO user_prefs (user_id, key, value, updated_at) VALUES ` +
      placeholders.join(", ") +
      ` ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
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
  include_in_analysis?: boolean;
  recurring_rule_id?: string | null;
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
    includeInAnalysis: row.include_in_analysis ?? true,
    recurringRuleId: row.recurring_rule_id || undefined,
  };
}

export async function listTransactions(userId: string): Promise<Transaction[]> {
  const db = getSql();
  const rows = (await db`SELECT id, date, time, category, price, currency, notes, include_in_analysis, recurring_rule_id
    FROM transactions WHERE user_id = ${userId} ORDER BY date DESC, time DESC`) as unknown as TxRow[];
  return rows.map(rowToTx);
}

export async function upsertMany(userId: string, txs: Transaction[]) {
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
      (await db`SELECT id FROM transactions
        WHERE user_id = ${userId} AND id = ANY(${ids})`) as unknown as Array<{
        id: string;
      }>
    ).map((r) => r.id)
  );

  const fresh = toWrite.filter((t) => !existing.has(t.id));
  if (fresh.length > 0) {
    // Content dedup is per user: the same expense is legitimately allowed in
    // two different people's ledgers.
    const contentRows = (await db`
      SELECT date::text || '|' || time || '|' || category || '|' || price::text || '|' || currency || '|' || notes AS ck
      FROM transactions WHERE user_id = ${userId}`) as unknown as Array<{ ck: string }>;
    const liveContent = new Set(contentRows.map((r) => r.ck));
    toWrite = toWrite.filter(
      (t) => existing.has(t.id) || !liveContent.has(contentKey(t))
    );
  }
  if (toWrite.length === 0) return;

  const CHUNK = 100;
  for (let i = 0; i < toWrite.length; i += CHUNK) {
    const chunk = toWrite.slice(i, i + CHUNK);
    const params: (string | number | boolean)[] = [];
    const placeholders: string[] = [];
    chunk.forEach((t, j) => {
      const base = j * 10;
      params.push(
        userId,
        t.id,
        t.date,
        t.time,
        t.category,
        t.price,
        t.currency,
        t.notes,
        t.includeInAnalysis ?? true,
        t.recurringRuleId ?? ""
      );
      placeholders.push(
        `($${base + 1}::text, $${base + 2}::text, $${base + 3}::date, $${base + 4}::text, $${base + 5}::text, $${base + 6}::double precision, $${base + 7}::text, $${base + 8}::text, $${base + 9}::boolean, NULLIF($${base + 10}::text, ''), now())`
      );
    });
    const query =
      `INSERT INTO transactions (user_id, id, date, time, category, price, currency, notes, include_in_analysis, recurring_rule_id, updated_at) VALUES ` +
      placeholders.join(", ") +
      ` ON CONFLICT (user_id, id) DO UPDATE SET
        date = EXCLUDED.date,
        time = EXCLUDED.time,
        category = EXCLUDED.category,
        price = EXCLUDED.price,
        currency = EXCLUDED.currency,
        notes = EXCLUDED.notes,
        include_in_analysis = EXCLUDED.include_in_analysis,
        recurring_rule_id = EXCLUDED.recurring_rule_id,
        updated_at = now()`;
    await db.query(query, params);
  }
}

export async function deleteTransactions(userId: string, ids: string[]) {
  const db = getSql();
  if (ids.length === 0) return;
  const params: string[] = [userId];
  const placeholders = ids.map((id, i) => {
    params.push(id);
    return `$${i + 2}::text`;
  });
  await db.query(
    `DELETE FROM transactions WHERE user_id = $1 AND id IN (${placeholders.join(", ")})`,
    params
  );
}

export async function clearAllTransactions(userId: string) {
  const db = getSql();
  await db`DELETE FROM transactions WHERE user_id = ${userId}`;
}

export async function countTransactions(userId: string): Promise<number> {
  const db = getSql();
  const rows = (await db`SELECT COUNT(*)::int AS n FROM transactions WHERE user_id = ${userId}`) as unknown as Array<{
    n: number;
  }>;
  return rows[0]!.n;
}

export async function listCategoryNames(userId: string): Promise<string[]> {
  const db = getSql();
  const rows = (await db`SELECT DISTINCT category FROM transactions
    WHERE user_id = ${userId} ORDER BY category`) as unknown as Array<{
    category: string;
  }>;
  return rows.map((r) => r.category);
}

interface RuleRow {
  id: string;
  category: string;
  price: number;
  notes: string | null;
  frequency: string;
  start_date: unknown;
  time: string | null;
  last_generated: unknown;
  include_in_analysis: boolean;
  paused: boolean;
}

function rowToRule(row: RuleRow): RecurringRule {
  return {
    id: row.id,
    category: row.category,
    price: row.price,
    notes: row.notes || "",
    frequency: row.frequency === "yearly" ? "yearly" : "monthly",
    startDate: toDateStr(row.start_date),
    time: row.time || "00:00",
    lastGenerated: row.last_generated ? toDateStr(row.last_generated) : null,
    includeInAnalysis: row.include_in_analysis ?? false,
    paused: row.paused ?? false,
  };
}

export async function listRecurring(userId: string): Promise<RecurringRule[]> {
  const db = getSql();
  const rows = (await db`SELECT id, category, price, notes, frequency, start_date, time, last_generated, include_in_analysis, paused
    FROM recurring WHERE user_id = ${userId} ORDER BY created_at ASC`) as unknown as RuleRow[];
  return rows.map(rowToRule);
}

export async function upsertRecurring(userId: string, rule: RecurringRule) {
  const db = getSql();
  await db.query(
    `INSERT INTO recurring (user_id, id, category, price, notes, frequency, start_date, time, last_generated, include_in_analysis, paused)
     VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8, $9::date, $10, $11)
     ON CONFLICT (user_id, id) DO UPDATE SET
       category = EXCLUDED.category, price = EXCLUDED.price, notes = EXCLUDED.notes,
       frequency = EXCLUDED.frequency, start_date = EXCLUDED.start_date, time = EXCLUDED.time,
       last_generated = EXCLUDED.last_generated, include_in_analysis = EXCLUDED.include_in_analysis, paused = EXCLUDED.paused`,
    [userId, rule.id, rule.category, rule.price, rule.notes, rule.frequency, rule.startDate, rule.time, rule.lastGenerated, rule.includeInAnalysis, rule.paused]
  );
}

export async function deleteRecurring(userId: string, id: string) {
  const db = getSql();
  await db`DELETE FROM recurring WHERE user_id = ${userId} AND id = ${id}`;
}

/** Every occurrence date of a rule within (fromInclusive, toInclusive]. */
export function occurrenceDates(
  rule: Pick<RecurringRule, "frequency" | "startDate">,
  fromInclusive: string | null,
  toInclusive: string
): string[] {
  const out: string[] = [];
  const parse = (s: string) => new Date(`${s}T00:00:00Z`);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  let cur = parse(rule.startDate);
  const end = parse(toInclusive);
  const floor = fromInclusive ? parse(fromInclusive) : null;
  let guard = 0;
  while (cur <= end && guard < 5000) {
    guard += 1;
    const ds = fmt(cur);
    if (!floor || cur > floor) out.push(ds);
    if (rule.frequency === "yearly") {
      const start = parse(rule.startDate);
      const year = cur.getUTCFullYear() + 1;
      const month = start.getUTCMonth();
      const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
      cur = new Date(Date.UTC(year, month, Math.min(start.getUTCDate(), lastDay)));
    } else {
      // Monthly: keep the day-of-month of startDate, clamping to month length.
      const day = parse(rule.startDate).getUTCDate();
      const next = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 1));
      const daysInMonth = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
      next.setUTCDate(Math.min(day, daysInMonth));
      cur = next;
    }
  }
  return out;
}

/**
 * Materialize due recurring-rule occurrences as real transactions. Runs on
 * GET /api/transactions; deterministic ids + the lastGenerated cursor make it
 * idempotent, and a manually deleted instance is not resurrected.
 */
export async function applyRecurring(userId: string): Promise<number> {
  const rules = await listRecurring(userId);
  if (rules.length === 0) return 0;
  const today = new Date().toISOString().slice(0, 10);
  const toAdd: Transaction[] = [];
  for (const rule of rules) {
    if (rule.paused) continue;
    const due = occurrenceDates(rule, rule.lastGenerated, today);
    if (due.length === 0) continue;
    for (const date of due) {
      toAdd.push({
        id: `r-${rule.id}-${date}`,
        date,
        time: rule.time || "00:00",
        category: rule.category,
        price: rule.price,
        currency: "INR",
        notes: rule.notes,
        includeInAnalysis: rule.includeInAnalysis,
        recurringRuleId: rule.id,
      });
    }
    await upsertRecurring(userId, { ...rule, lastGenerated: due[due.length - 1] });
  }
  if (toAdd.length > 0) await upsertMany(userId, toAdd);
  return toAdd.length;
}

/**
 * One-shot: adopt the categories already in a user's ledger as their own
 * (user-added) categories, so shrinking DEFAULT_CATEGORIES never orphans past
 * transactions. Runs once per user — the pref row's presence is the marker.
 */
export async function seedCustomCategories(userId: string): Promise<void> {
  const db = getSql();
  const marker = (await db`SELECT 1 AS ok FROM user_prefs
    WHERE user_id = ${userId} AND key = ${CUSTOM_CATEGORIES_KEY}`) as unknown as Array<{
    ok: number;
  }>;
  if (marker.length > 0) return;
  const names = await listCategoryNames(userId);
  const custom = names.filter((n) => !isDefaultCategory(n));
  await upsertPrefs(userId, [
    { key: CUSTOM_CATEGORIES_KEY, value: JSON.stringify(custom) },
  ]);
}
