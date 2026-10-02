"use client";

import { useMemo, useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { useCategories } from "@/hooks/useCategories";
import { categoryColor } from "@/lib/types";
import { aggregateByCategory } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";
import { Skeleton } from "@/components/ui";
import TransactionRow from "@/components/TransactionRow";

export default function CategoriesPage() {
  const { transactions, loaded } = useExpenses();
  const { categories, custom: customCats, addCategory, removeCategory } =
    useCategories();
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [managing, setManaging] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const cats = useMemo(() => aggregateByCategory(transactions), [transactions]);

  const loading = !loaded && transactions.length === 0;

  const byCat = useMemo(() => {
    const map = new Map<string, typeof transactions>();
    for (const t of transactions) {
      if (t.price >= 0) continue;
      const list = map.get(t.category) || [];
      list.push(t);
      map.set(t.category, list);
    }
    map.forEach((v) =>
      v.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
    );
    return map;
  }, [transactions]);

  function submitNew() {
    const res = addCategory(draft);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setDraft("");
    setError(null);
  }

  if (loading) {
    return (
      <main className="flex-1 space-y-3 p-4 pt-5">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-accent-text">Spending map</p>
        <h1 className="text-3xl font-black tracking-tight">Categories</h1>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </main>
    );
  }

  if (cats.length === 0) {
    return (
      <main className="flex-1 space-y-3 p-4 pt-5">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-accent-text">Spending map</p>
        <h1 className="text-3xl font-black tracking-tight">Categories</h1>
        <p className="text-sm text-ink-3">
          No expenses yet. Add one with the + button or import a CSV to see
          category breakdowns.
        </p>
        {managing && (
          <div className="card space-y-3 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                maxLength={24}
                aria-label="New category name"
                placeholder="e.g. Coffee"
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitNew();
                  }
                }}
                className={`field min-w-0 flex-1 py-2 text-sm ${
                  error ? "border-red-400" : "border-line focus:border-accent"
                }`}
              />
              <button
                onClick={submitNew}
                disabled={!draft.trim()}
                className="btn-primary shrink-0 px-3 py-2 text-sm"
              >
                Add
              </button>
            </div>
            {error && (
              <p aria-live="polite" className="text-xs text-red-500">
                {error}
              </p>
            )}
          </div>
        )}
        <button
          onClick={() => setManaging((v) => !v)}
          aria-expanded={managing}
          className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold ${
            managing
              ? "chip-active"
              : "border border-line-strong bg-panel-2 text-ink-3"
          }`}
        >
          {managing ? "Done" : "+ Category"}
        </button>
      </main>
    );
  }

  return (
    <main className="flex-1 space-y-4 p-4 pt-5 sm:p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-accent-text">Spending map</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Categories</h1>
          <p className="mt-1 text-sm text-ink-3">
            {cats.length} categories, tap to see notes
          </p>
        </div>
        <button
          onClick={() => setManaging((v) => !v)}
          aria-expanded={managing}
          className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
            managing
              ? "chip-active"
              : "border border-line-strong bg-panel-2 text-ink-3"
          }`}
        >
          {managing ? "Done" : "+ Category"}
        </button>
      </header>

      {managing && (
        <div className="card space-y-3 p-4">
          <div>
            <p className="text-sm font-semibold">Add a category</p>
            <p className="mt-0.5 text-xs text-ink-3">
              It shows up in the add/edit sheet and in filters, on all your
              devices.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              autoFocus
              maxLength={24}
              aria-label="New category name"
              placeholder="e.g. Coffee"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitNew();
                }
              }}
              className={`field min-w-0 flex-1 py-2 text-sm ${
                error ? "border-red-400" : "border-line focus:border-accent"
              }`}
            />
            <button
              onClick={submitNew}
              disabled={!draft.trim()}
              className="btn-primary shrink-0 px-3 py-2 text-sm"
            >
              Add
            </button>
          </div>
          {error && (
            <p aria-live="polite" className="text-xs text-red-500">
              {error}
            </p>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold text-ink-3">
              YOUR CATEGORIES
            </p>
            <ul className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const custom = customCats.includes(c);
                return (
                  <li
                    key={c}
                    className="flex items-center gap-1 rounded-full border border-line-strong bg-panel-2 py-1 pl-2.5 pr-1 text-xs font-medium text-ink-2"
                  >
                    {c}
                    {custom ? (
                      <button
                        onClick={() => removeCategory(c)}
                        aria-label={`Remove ${c}`}
                        title="Remove from your categories (past transactions keep it)"
                        className="flex h-5 w-5 items-center justify-center rounded-full text-ink-3 active:bg-red-500/15 active:text-red-500"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                        >
                          <path d="M6 6l12 12M6 18 18 6" />
                        </svg>
                      </button>
                    ) : (
                      <span className="pr-1.5 text-[10px] font-normal text-ink-3">
                        default
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {cats.map((c) => {
          const color = categoryColor(c.name);
          const list = byCat.get(c.name) || [];
          const open = openCat === c.name;
          return (
            <li key={c.name} className="overflow-hidden rounded-2xl border border-line bg-panel">
              <button
                onClick={() => setOpenCat(open ? null : c.name)}
                aria-expanded={open}
                aria-controls={`cat-${c.name.replace(/\s+/g, "-")}`}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span
                  className="h-9 w-9 shrink-0 rounded-xl"
                  style={{ background: `${color}22`, border: `1px solid ${color}55` }}
                >
                  <span
                    className="flex h-full w-full items-center justify-center text-sm font-bold"
                    style={{ color }}
                  >
                    {c.name[0]}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {c.name}
                  </span>
                  <span className="block text-xs text-ink-3">
                    {c.count} transactions
                  </span>
                </span>
                <span className="text-sm font-semibold">
                  {formatMoney(c.value)}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  className={`h-4 w-4 text-ink-3 transition-transform ${open ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {open && (
                <ul
                  id={`cat-${c.name.replace(/\s+/g, "-")}`}
                  className="border-t border-line bg-panel-2"
                >
                  {list.slice(0, 20).map((t) => (
                    <li key={t.id} className="border-t border-line bg-panel-2/50">
                      <TransactionRow tx={t} showCategory={false} compact />
                    </li>
                  ))}
                  {list.length > 20 && (
                    <li className="px-4 py-2 text-xs text-ink-3">
                      +{list.length - 20} more
                    </li>
                  )}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
