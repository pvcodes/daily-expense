"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useExpenses } from "@/hooks/useExpenses";
import { useSyncedPref } from "@/hooks/useSyncedPref";
import { useCategories } from "@/hooks/useCategories";
import { useRecurring } from "@/hooks/useRecurring";
import { mergeCategories, DEFAULT_CATEGORIES, type RecurrenceFrequency } from "@/lib/types";
import { formatMoney, localTodayISO } from "@/lib/format";
import { EmptyState, Skeleton } from "@/components/ui";
import TransactionRow from "@/components/TransactionRow";
import CategoryPicker from "@/components/CategoryPicker";

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
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const { transactions, deleteTransaction, loaded, refresh } = useExpenses();
  const { categories } = useCategories();
  const { rules, addRule, removeRule, updateRule } = useRecurring();
  const [showRecurring, setShowRecurring] = useState(false);
  const [rrPrice, setRrPrice] = useState("");
  const [rrCategory, setRrCategory] = useState<string>(DEFAULT_CATEGORIES[0]);
  const [rrNotes, setRrNotes] = useState("");
  const [rrFrequency, setRrFrequency] = useState<RecurrenceFrequency>("monthly");
  const [rrStart, setRrStart] = useState(() => localTodayISO());
  const [rrError, setRrError] = useState<string | null>(null);
  const [confirmRuleId, setConfirmRuleId] = useState<string | null>(null);
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

  async function submitRule(e: React.FormEvent) {
    e.preventDefault();
    const p = parseFloat(rrPrice);
    if (!Number.isFinite(p) || p <= 0) {
      setRrError("Enter a valid amount");
      return;
    }
    setRrError(null);
    try {
      await addRule({
        category: rrCategory,
        price: -p,
        notes: rrNotes,
        frequency: rrFrequency,
        startDate: rrStart,
        time: "00:00",
        includeInAnalysis: false,
        paused: false,
      });
      setRrPrice("");
      setRrNotes("");
      void refresh();
    } catch {
      setRrError("Couldn't save — check your connection");
    }
  }

  const onCat = (c: string) => {
    setCat(c);
    setPage(1);
  };
  const onSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  // Only categories that actually have rows get a chip, in list order, with
  // anything unexpected from an import appended so it stays reachable.
  const cats = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => set.add(t.category));
    const known = categories.filter((c) => set.has(c));
    const extra = [...set].filter((c) => !categories.includes(c));
    return ["all", ...mergeCategories(known, extra)];
  }, [transactions, categories]);

  // A filter remembered from another device may not exist here any more.
  useEffect(() => {
    if (cat !== "all" && !cats.includes(cat)) setCat("all");
  }, [cat, cats, setCat]);

  useEffect(() => {
    if (categoryParam && cats.includes(categoryParam)) {
      setCat(categoryParam);
      setPage(1);
    }
  }, [categoryParam, cats, setCat]);

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
    <main className="flex-1 space-y-4 p-4 pt-5 sm:p-5">
      <header>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-accent-text">Your ledger</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Transactions</h1>
        <p className="mt-1 text-sm text-ink-3">
          {loading
            ? "Loading…"
            : filtered.length === 0
              ? "No transactions"
              : `${pageItems.start}–${pageItems.end} of ${filtered.length}${
                  filtered.length > 0 ? ` · ${formatMoney(total)} spent` : ""
                }`}
        </p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-[var(--card-shadow)]">
        <button
          onClick={() => setShowRecurring((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-ink"
        >
          <span>Recurring rules{rules.length > 0 ? ` (${rules.length})` : ""}</span>
          <span className="text-ink-3">{showRecurring ? "Hide" : "Manage"}</span>
        </button>
        {showRecurring && (
          <div className="space-y-3 border-t border-line p-4">
            {rules.length === 0 ? (
              <p className="text-sm text-ink-3">
                No recurring rules yet. Add one to auto-create expenses like rent or subscriptions.
              </p>
            ) : (
              <ul className="space-y-2">
                {rules.map((r) => (
                  <li key={r.id} className="flex items-center gap-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">
                        {r.notes || r.category}{" "}
                        <span className="text-ink-3">
                          · {formatMoney(Math.abs(r.price))} · {r.frequency}
                        </span>
                      </p>
                      <p className="text-xs text-ink-3">{r.category} · from {r.startDate} · {r.includeInAnalysis ? "Included in analysis" : "Excluded from analysis"}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!r.paused}
                      aria-label={`${r.paused ? "Resume" : "Pause"} ${r.notes || r.category}`}
                      onClick={() => void updateRule({ ...r, paused: !r.paused })}
                      className="min-h-11 shrink-0 rounded-lg border border-line-strong bg-panel-2 px-3 text-xs font-semibold text-ink"
                    >
                      {r.paused ? "Resume" : "Pause"}
                    </button>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={r.includeInAnalysis}
                      aria-label={`${r.includeInAnalysis ? "Exclude" : "Include"} from analysis`}
                      onClick={() => void updateRule({ ...r, includeInAnalysis: !r.includeInAnalysis })}
                      className="min-h-11 shrink-0 rounded-lg border border-line-strong bg-panel-2 px-3 text-xs font-semibold text-ink"
                    >
                      {r.includeInAnalysis ? "Charts on" : "Charts off"}
                    </button>
                    {confirmRuleId === r.id ? (
                      <>
                        <button
                          onClick={() => setConfirmRuleId(null)}
                          className="min-h-11 rounded-lg border border-line-strong bg-panel-2 px-3 py-2 text-xs font-medium text-ink"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            void removeRule(r.id);
                            setConfirmRuleId(null);
                          }}
                          className="min-h-11 rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white"
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmRuleId(r.id)}
                        aria-label={`Delete ${r.notes || r.category}`}
                        className="flex h-11 w-11 items-center justify-center rounded-full text-ink-3 active:bg-red-500/10 active:text-red-500"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                          <path d="M6 6l12 12M6 18 18 6" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={submitRule} className="space-y-2 border-t border-line pt-3">
              <input
                type="number"
                inputMode="decimal"
                aria-label="Amount"
                placeholder="Amount"
                value={rrPrice}
                onChange={(e) => setRrPrice(e.target.value)}
                className="field w-full placeholder:text-ink-3"
              />
              <CategoryPicker value={rrCategory} onChange={setRrCategory} />
              <div className="grid grid-cols-2 gap-2">
                <select
                  aria-label="Frequency"
                  value={rrFrequency}
                  onChange={(e) => setRrFrequency(e.target.value as RecurrenceFrequency)}
                  className="field min-w-0"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <input
                  type="date"
                  aria-label="Start date"
                  value={rrStart}
                  onChange={(e) => setRrStart(e.target.value)}
                  className="field min-w-0"
                />
              </div>
              <input
                type="text"
                placeholder="Notes (optional)"
                aria-label="Notes"
                value={rrNotes}
                onChange={(e) => setRrNotes(e.target.value)}
                className="field w-full placeholder:text-ink-3"
              />
              {rrError && <p className="text-xs text-red-500">{rrError}</p>}
              <button
                type="submit"
                disabled={!rrPrice}
                className="btn-primary w-full py-2.5 text-sm"
              >
                Add recurring rule
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="flex gap-2 -mx-4 overflow-x-auto px-4 no-scrollbar">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => onCat(c)}
            className={`min-h-11 shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-colors ${
              cat === c
                ? "chip-active"
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
        className="field w-full px-4 py-3 placeholder:text-ink-3"
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
                  className="overflow-hidden card transition-colors data-[confirm=true]:border-red-300 dark:data-[confirm=true]:border-red-800"
                  data-confirm={confirming}
                >
                  {confirming ? (
                    <div className="flex gap-2 border-t border-line bg-red-500/5 px-3 py-2.5">
                      <p className="flex flex-1 items-center text-xs text-ink-3">
                        Delete this transaction?
                      </p>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="min-h-11 rounded-lg border border-line-strong bg-panel-2 px-3 py-2 text-xs font-medium text-ink active:scale-[0.98]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          deleteTransaction(t.id);
                          setConfirmId(null);
                        }}
                        className="min-h-11 rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white active:scale-[0.98]"
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
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-3 active:bg-red-500/10 active:text-red-500"
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
                className="min-h-11 rounded-xl border border-line-strong bg-panel-2 px-3 py-2 text-sm font-medium text-ink active:scale-[0.98] disabled:opacity-40"
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
                        className={`h-11 w-11 shrink-0 rounded-lg text-sm font-medium transition-colors active:scale-[0.98] ${
                          n === pageItems.currentPage
                            ? "chip-active"
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
                className="min-h-11 rounded-xl border border-line-strong bg-panel-2 px-3 py-2 text-sm font-medium text-ink active:scale-[0.98] disabled:opacity-40"
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
