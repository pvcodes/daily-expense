"use client";

import { useMemo } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { currentMonthLabel, monthDelta, monthSummary } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";

function SyncPill() {
  const { offline, lastSyncAt } = useExpenses();
  const online = useNetworkStatus();
  const offlineShowing = offline || !online;

  if (offlineShowing) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-panel px-2.5 py-1 text-[11px] font-semibold text-ink-3">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Offline · cached
      </span>
    );
  }
  if (lastSyncAt == null) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-panel px-2.5 py-1 text-[11px] font-semibold text-ink-3">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-3" />
        Loading…
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-panel px-2.5 py-1 text-[11px] font-semibold text-ink-3">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      Updated {new Date(lastSyncAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}

export default function MonthSummary() {
  const { transactions } = useExpenses();
  const { spend } = useMemo(
    () => monthSummary(transactions),
    [transactions]
  );
  const { pct } = useMemo(() => monthDelta(transactions), [transactions]);

  const todayTotal = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${d}`;
    return transactions.reduce(
      (sum, t) => (t.date === key && t.price < 0 ? sum - t.price : sum),
      0
    );
  }, [transactions]);

  const up = pct !== null && pct > 0;

  return (
    <header className="relative overflow-hidden rounded-[1.75rem] bg-panel px-5 pb-5 pt-5 shadow-[var(--card-shadow)]">
      <div aria-hidden="true" className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-accent opacity-15 blur-2xl" />
      <div className="relative">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-ink-3">
            Spent this month
          </p>
          <h1 className="mt-3 truncate text-[2.8rem] font-black leading-none tracking-[-0.07em] tabular-nums sm:text-5xl">
            {formatMoney(spend)}
          </h1>
        </div>
        <div className="pt-1 text-right">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-ink-3">{currentMonthLabel()}</p>
          <SyncPill />
        </div>
      </div>

      {pct !== null && (
        <span
          className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
            up ? "bg-bad/10 text-bad" : "bg-good/10 text-good"
          }`}
        >
          {up ? "▲" : "▼"} {Math.abs(pct)}% vs same dates last month
        </span>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2 border-t border-line pt-4">
        <div className="rounded-2xl bg-panel-2 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">Today</p>
          <p className="mt-0.5 truncate text-sm font-bold tabular-nums text-ink">
            {todayTotal > 0 ? formatMoney(todayTotal) : "—"}
          </p>
        </div>
        <div className="rounded-2xl bg-panel-2 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">Daily average</p>
          <p className="mt-0.5 truncate text-sm font-bold tabular-nums text-ink">
            {formatMoney(spend / new Date().getDate())}
          </p>
        </div>
      </div>
      </div>
    </header>
  );
}
