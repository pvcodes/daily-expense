export interface Transaction {
  id: string;
  date: string; // yyyy-MM-dd
  time: string; // HH:mm
  category: string;
  price: number; // negative = expense, positive = income
  currency: string;
  notes: string;
  /** Generated recurring rows can be hidden from analytics while staying in the ledger. */
  includeInAnalysis?: boolean;
  recurringRuleId?: string;
}

export type RecurrenceFrequency = "monthly" | "yearly";

/**
 * A rule that materializes into real transactions on a schedule. Instances are
 * written with deterministic ids (`r-<ruleId>-<date>`) so catching up is
 * idempotent; deleting a generated instance keeps it deleted (the rule's
 * lastGenerated cursor has passed it).
 */
export interface RecurringRule {
  id: string;
  category: string;
  price: number; // negative = expense, positive = income
  notes: string;
  frequency: RecurrenceFrequency;
  /** First possible occurrence, yyyy-MM-dd. */
  startDate: string;
  time: string; // HH:mm
  /** Last occurrence date that was materialized, yyyy-MM-dd or null. */
  lastGenerated: string | null;
  includeInAnalysis: boolean;
  paused: boolean;
}

export function contentKey(t: Transaction): string {
  return `${t.date}|${t.time}|${t.category}|${t.price}|${t.currency}|${t.notes}`;
}

/** Stable, opaque row id generated once when a transaction is first created. */
export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `u${crypto.randomUUID().replace(/-/g, "")}`;
  }
  return `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * The five categories every new account starts with. Chosen to match the
 * buckets that dominate personal spending (food service, housing/utilities,
 * transport, groceries, general shopping) so the default set needs no tuning
 * for most people. Anything else is added per user — see hooks/useCategories.
 */
export const DEFAULT_CATEGORIES = [
  "Eat Out",
  "Bills",
  "Transport",
  "Groceries",
  "Shopping",
] as const;

export type DefaultCategory = (typeof DEFAULT_CATEGORIES)[number];

/** Pref key holding the user's own categories (JSON array of names). */
export const CUSTOM_CATEGORIES_KEY = "expense-tracker.customCats.v1";

/** Keeps category chips readable and the stored list small. */
export const MAX_CATEGORY_LEN = 24;

export function normalizeCategory(raw: string): string {
  return (raw || "").replace(/\s+/g, " ").trim().slice(0, MAX_CATEGORY_LEN);
}

export function sameCategory(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** Concatenates category lists, dropping case-insensitive duplicates and keeping the first spelling seen. */
export function mergeCategories(...lists: Array<readonly string[]>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const list of lists) {
    for (const raw of list) {
      const name = normalizeCategory(raw);
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(name);
    }
  }
  return out;
}

export function isDefaultCategory(name: string): boolean {
  return DEFAULT_CATEGORIES.some((c) => sameCategory(c, name));
}

/**
 * Fixed colors for known categories; anything else gets a stable color derived
 * from its name, so user-added categories still look distinct in charts.
 */
export const CATEGORY_COLORS: Record<string, string> = {
  "Eat Out": "#f97316",
  Bills: "#6366f1",
  Transport: "#3b82f6",
  Groceries: "#22c55e",
  Shopping: "#e11d48",
  // Categories from earlier ledgers / common custom names.
  Chai: "#f59e0b",
  Fashion: "#a855f7",
  Food: "#ec4899",
  Misc: "#64748b",
  Subscriptions: "#06b6d4",
  Utilities: "#84cc16",
  "No Category": "#94a3b8",
  Salary: "#10b981",
};

const FALLBACK_COLORS = [
  "#f97316",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#e11d48",
  "#10b981",
  "#6366f1",
];

export function categoryColor(name: string): string {
  const known = CATEGORY_COLORS[name];
  if (known) return known;
  let hash = 0;
  const key = normalizeCategory(name).toLowerCase() || "?";
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}
