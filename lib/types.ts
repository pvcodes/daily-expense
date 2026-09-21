export interface Transaction {
  id: string;
  date: string; // yyyy-MM-dd
  time: string; // HH:mm
  category: string;
  price: number; // negative = expense, positive = income
  currency: string;
  notes: string;
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

export const CATEGORIES = [
  "Chai",
  "Eat Out",
  "Fashion",
  "Food",
  "Groceries",
  "Misc",
  "Shopping",
  "Subscriptions",
  "Transport",
  "Utilities",
];

export const CATEGORY_COLORS: Record<string, string> = {
  Chai: "#f59e0b",
  "Eat Out": "#f97316",
  Fashion: "#a855f7",
  Food: "#ec4899",
  Groceries: "#22c55e",
  Misc: "#64748b",
  Shopping: "#e11d48",
  Subscriptions: "#06b6d4",
  Transport: "#3b82f6",
  Utilities: "#84cc16",
  "No Category": "#94a3b8",
  Salary: "#10b981",
};
