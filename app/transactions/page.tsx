"use client";

import { Suspense, useMemo, useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { useSyncedPref } from "@/hooks/useSyncedPref";
import { CATEGORIES } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { EmptyState, Skeleton } from "@/components/ui";
import TransactionRow from "@/components/TransactionRow";

const PAGE = 50;

function pageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  const pages: (number | "…")[] = [1];
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

function TransactionsContent() {
  const { transactions, deleteTransaction, loaded } = useExpenses();
  const [cat, setCat] = useSyncedPref<string>(
    "expense-tracker.txns.cat",
    "all"
  );
  const [search, setSearch] = useSyncedPref<string>(
    "expense-tracker.txns.search",
    ""
  );
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const onCat = (c: string) => {
    setCat(c);
    setPage(1);
  };
  const onSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  const cats = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => set.add(t.category));
    return ["all", ...CATEGORIES.filter((c) => set.has(c))];
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => (cat === "all" ? true : t.category === cat))
      .filter((t) =>
        search
          ? (t.notes || "").toLowerCase().includes(search.toLowerCase())
          : true
      )
      .sort((a, b) =>
        `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)
      );
  }, [transactions, cat, search]);

  const total = useMemo(
    () => filtered.reduce((s, t) => s + (t.price < 0 ? -t.price : 0), 0),
    [filtered]
  );

  const pageItems = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE));
    const currentPage = Math.min(page, totalPages);
    return {
      items: filtered.slice((currentPage - 1) * PAGE, currentPage * PAGE),
      currentPage,
      totalPages,
      start: filtered.length === 0 ? 0 : (currentPage - 1) * PAGE + 1,
      end: Math.min(filtered.length, currentPage * PAGE),
    };
  }, [filtered, page]);

  const loading = !loaded && transactions.length === 0;

  return (
    <main className="flex-1 space-y-4 p-4 pt-6">
      <header>
        <h1 className="text-2xl font-bold">Transactions</h1>
        <p className="text-sm text-ink-3">
          {loading
            ? "Loading…"
            : filtered.length === 0
              ? "No transactions"
              : `${pageItems.start}–${pageItems.end} of ${filtered.length}${
                  filtered.length > 0 ? ` · ${formatMoney(total)} spent` : ""
                }`}
        </p>
      </header>

      <div className="flex gap-2 -mx-4 overflow-x-auto px-4 no-scrollbar">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => onCat(c)}
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-medium transition-colors ${
              cat === c
                ? "bg-accent text-accent-ink"
                : "bg-panel-2 text-ink-3"
            }`}
          >
            {c === "all" ? "All" : c}
          </button>
        ))}
      </div>

      <input
        type="search"
        placeholder="Search notes…"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        className="w-full rounded-xl border border-line bg-panel-2 px-4 py-3 text-base placeholder:text-ink-3 focus:border-accent focus:outline-none"
      />

      {loading ? (
        <ul className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={transactions.length === 0 ? "No transactions yet" : "Nothing matches"}
          hint={
            transactions.length === 0
              ? "Add your first expense with the + button, or import a CSV from Settings."
              : "Try a different category or search term."
          }
        />
      ) : (
        <div className="space-y-2">
          <ul className="space-y-2">
            {pageItems.items.map((t) => {
              const confirming = confirmId === t.id;
              return (
                <li
                  key={t.id}
                  className="overflow-hidden rounded-2xl border border-line bg-panel transition-colors data-[confirm=true]:border-red-300 dark:data-[confirm=true]:border-red-800"
                  data-confirm={confirming}
                >
                  {confirming ? (
                    <div className="flex gap-2 border-t border-line bg-red-500/5 px-3 py-2.5">
                      <p className="flex flex-1 items-center text-xs text-ink-3">
                        Delete this transaction?
                      </p>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="rounded-lg border border-line-strong bg-panel-2 px-3 py-1.5 text-xs font-medium text-ink active:scale-[0.98]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          deleteTransaction(t.id);
                          setConfirmId(null);
                        }}
                        className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white active:scale-[0.98]"
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 pr-2">
                      <TransactionRow tx={t} />
                      <button
                        onClick={() => setConfirmId(t.id)}
                        aria-label={`Delete ${t.notes || t.category}`}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-3 active:bg-red-500/10 active:text-red-500"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path d="M6 6l12 12M6 18 18 6" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {pageItems.totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                onClick={() => setPage(Math.max(1, pageItems.currentPage - 1))}
                disabled={pageItems.currentPage === 1}
                aria-label="Previous page"
                className="rounded-xl border border-line-strong bg-panel-2 px-3 py-2 text-sm font-medium text-ink active:scale-[0.98] disabled:opacity-40"
              >
                Prev
              </button>
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {pageList(pageItems.currentPage, pageItems.totalPages).map(
                  (n, i) =>
                    n === "…" ? (
                      <span key={`e${i}`} className="px-1 text-sm text-ink-3">
                        …
                      </span>
                    ) : (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        aria-current={
                          n === pageItems.currentPage ? "page" : undefined
                        }
                        className={`h-9 w-9 shrink-0 rounded-lg text-sm font-medium transition-colors active:scale-[0.98] ${
                          n === pageItems.currentPage
                            ? "bg-accent text-accent-ink"
                            : "bg-panel-2 text-ink-3"
                        }`}
                      >
                        {n}
                      </button>
                    )
                )}
              </div>
              <button
                onClick={() =>
                  setPage(
                    Math.min(pageItems.totalPages, pageItems.currentPage + 1)
                  )
                }
                disabled={pageItems.currentPage === pageItems.totalPages}
                aria-label="Next page"
                className="rounded-xl border border-line-strong bg-panel-2 px-3 py-2 text-sm font-medium text-ink active:scale-[0.98] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={null}>
      <TransactionsContent />
    </Suspense>
  );
}