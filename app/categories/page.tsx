"use client";

import { useMemo, useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { CATEGORY_COLORS } from "@/lib/types";
import { aggregateByCategory } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";
import { Skeleton } from "@/components/ui";
import TransactionRow from "@/components/TransactionRow";

export default function CategoriesPage() {
  const { transactions, loaded } = useExpenses();
  const [openCat, setOpenCat] = useState<string | null>(null);

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

  if (loading) {
    return (
      <main className="flex-1 space-y-2 p-4 pt-6">
        <h1 className="text-2xl font-bold">Categories</h1>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </main>
    );
  }

  if (cats.length === 0) {
    return (
      <main className="p-4 pt-6">
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="mt-4 text-sm text-ink-3">
          No expenses yet. Add one with the + button or import a CSV to see
          category breakdowns.
        </p>
      </main>
    );
  }

  return (
    <main className="flex-1 space-y-3 p-4 pt-6">
      <header>
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-sm text-ink-3">
          {cats.length} categories, tap to see notes
        </p>
      </header>

      <ul className="space-y-2">
        {cats.map((c) => {
          const color = CATEGORY_COLORS[c.name] || "#64748b";
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