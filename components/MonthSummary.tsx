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
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line-strong bg-panel px-2.5 py-1 text-[11px] font-medium text-ink-3">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Offline · cached
      </span>
    );
  }
  if (lastSyncAt == null) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line-strong bg-panel px-2.5 py-1 text-[11px] font-medium text-ink-3">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-3" />
        Loading…
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line-strong bg-panel px-2.5 py-1 text-[11px] font-medium text-ink-3">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      Updated {new Date(lastSyncAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}

export default function MonthSummary() {
  const { transactions } = useExpenses();
  const { spend, income, net } = useMemo(
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
      (sum, t) => (t.date === key ? sum + Math.abs(t.price) : sum),
      0
    );
  }, [transactions]);

  const up = pct !== null && pct > 0;

  return (
    <header className="px-1 pb-2 pt-1">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-3">
            Spent in {currentMonthLabel()}
          </p>
          <h1 className="mt-1 truncate text-[2.75rem] font-bold leading-none tracking-tight tabular-nums text-ink">
            {formatMoney(spend)}
          </h1>
        </div>
        <div className="pt-1">
          <SyncPill />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs">
        {pct !== null && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${
              up
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                : "bg-accent/10 text-accent-text"
            }`}
          >
            {up ? "Up" : "Down"} {Math.abs(pct)}% vs last month
          </span>
        )}
        {todayTotal > 0 && (
          <span className="text-ink-2">
            Today <b className="font-semibold text-ink">{formatMoney(todayTotal)}</b>
          </span>
        )}
        <span aria-hidden className="text-ink-3">
          ·
        </span>
        <span className="text-ink-2">
          Income <b className="font-semibold text-accent-text">{formatMoney(income)}</b>
        </span>
        <span aria-hidden className="text-ink-3">
          ·
        </span>
        <span className="text-ink-2">
          Net{" "}
          <b
            className={`font-semibold ${
              net >= 0 ? "text-accent-text" : "text-rose-500 dark:text-rose-400"
            }`}
          >
            {formatMoney(net)}
          </b>
        </span>
      </div>
    </header>
  );
}