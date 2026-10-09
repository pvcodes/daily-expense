"use client";

import { useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useExpenses } from "@/hooks/useExpenses";
import MonthSummary from "@/components/MonthSummary";
import SpendingPaceChart from "@/components/SpendingPaceChart";
import { CategoryBars } from "@/components/Charts";
import { EmptyState, Section, Skeleton } from "@/components/ui";
import { categoryColor } from "@/lib/types";
import { currentMonthKey, currentMonthTopCategory, spendingPace, type PeriodKey } from "@/lib/analytics";
import { formatDate, formatMoney, formatTime, moneyWithSign } from "@/lib/format";
import { useSyncedPref } from "@/hooks/useSyncedPref";

const SpendingTrend = dynamic(
  () => import("@/components/SpendingTrend"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-52 w-full" />,
  }
);

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "day", label: "7 days" },
  { key: "month", label: "This month" },
  { key: "all", label: "6 months" },
];

export default function HomePage() {
  const { transactions, loaded } = useExpenses();
  const [period, setPeriod] = useSyncedPref<PeriodKey>(
    "expense-tracker.period",
    "month"
  );
  const activePeriod: PeriodKey = period === "day" || period === "month" || period === "all"
    ? period
    : period === "week"
      ? "day"
      : period === "quarter" || period === "year"
        ? "all"
        : "month";

  const monthKey = useMemo(() => currentMonthKey(), []);
  const thisMonth = useMemo(
    () => transactions.filter((t) => t.date.startsWith(monthKey)),
    [transactions, monthKey]
  );
  const pace = useMemo(() => spendingPace(transactions), [transactions]);
  const topCategory = useMemo(() => currentMonthTopCategory(transactions), [transactions]);

  const recent = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => {
          const kb = `${b.date} ${b.time}`;
          const ka = `${a.date} ${a.time}`;
          return kb.localeCompare(ka);
        })
        .slice(0, 5),
    [transactions]
  );

  const loading = !loaded && transactions.length === 0;

  return (
    <main className="flex-1 space-y-5 p-4 pt-4 sm:space-y-6 sm:p-5">
      <MonthSummary />

      <Section title="This month vs. usual">
        {pace.recentAverage === null || pace.projected === null ? (
          <div className="rounded-2xl bg-panel-2 px-4 py-3">
            <p className="text-sm font-semibold text-ink">Not enough history yet</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-3">
              Add expenses for two full months to compare this month with your usual spending.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-panel-2 px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs font-medium text-ink-3">Estimated total by month-end</span>
              <span className="text-lg font-black tabular-nums text-ink">{formatMoney(pace.projected)}</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-ink-3">
              Your usual month averages {formatMoney(pace.recentAverage)} over the last {pace.historyMonths} months.
            </p>
            <SpendingPaceChart pace={pace} />
            <p className="mt-2 text-[10px] text-ink-3">Estimate assumes your average daily spending stays the same.</p>
          </div>
        )}
      </Section>

      {(loading ? (
          <Section>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="mb-2 h-11 w-full" />
            ))}
          </Section>
        ) : (
          <Section
            title="Latest moves"
            aside={
              <Link href="/transactions" className="chip min-h-11 px-3 py-2 text-xs font-bold text-accent-text">
                All activity
              </Link>
            }
          >
            {recent.length === 0 ? (
              <EmptyState
                title="Your story starts here"
                hint="Log your first expense or import a CSV from Settings."
                action={<Link href="/settings" className="btn-primary inline-flex items-center rounded-full px-4 py-2 text-xs">Import transactions</Link>}
              />
            ) : (
              <ul className="divide-y divide-line">
                {recent.map((t) => (
                  <li key={t.id}>
                    <Link href={`/transactions/${t.id}`} className="flex min-h-14 items-center gap-3 rounded-xl px-1 py-2.5 transition-colors active:bg-panel-2">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black" style={{ background: `${categoryColor(t.category)}22`, color: categoryColor(t.category) }}>{t.category.slice(0, 1).toUpperCase()}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{t.notes || t.category}</div>
                        <div className="text-xs text-ink-3">{formatDate(t.date)}{t.time && t.time !== "00:00" ? ` · ${formatTime(t.time)}` : ""} · {t.category}</div>
                      </div>
                      <div className="text-sm font-bold tabular-nums text-ink">{t.price < 0 ? moneyWithSign(t.price) : formatMoney(t.price)}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        ))}

      {(loading ? (
          <Section>
            <Skeleton className="h-52 w-full" />
          </Section>
        ) : (
          <Section
            title="Spending trend"
            aside={
              <div className="flex flex-wrap justify-end gap-1">
                {PERIODS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPeriod(p.key)}
                    className={`chip min-h-11 rounded-full px-3 py-2 text-[11px] font-bold transition-colors ${
                      activePeriod === p.key
                        ? "chip-active"
                        : "text-ink-3 hover:text-ink"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            }
          >
            <SpendingTrend period={activePeriod} />
            {activePeriod === "month" && (
          <p className="mt-1 text-center text-[11px] text-ink-3">
                Weekly totals, month to date
              </p>
            )}
            {activePeriod === "day" && (
              <p className="mt-1 text-center text-[11px] text-ink-3">Daily totals, last 7 days</p>
            )}
            {activePeriod === "all" && (
              <p className="mt-1 text-center text-[11px] text-ink-3">Monthly totals, current month is partial</p>
            )}
          </Section>
        ))}

      {(loading ? (
          <Section>
            <Skeleton className="h-40 w-full" />
          </Section>
        ) : (
          <Section
            title="Where this month went"
            aside={<Link href="/categories" className="chip min-h-11 px-3 py-2 text-xs font-bold text-accent-text">All categories</Link>}
          >
            {topCategory && (
              <Link href={`/transactions?category=${encodeURIComponent(topCategory.name)}`} className="mb-3 flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-panel-2 px-4 py-3 active:bg-panel">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-3">Top category</p>
                  <p className="truncate text-sm font-semibold text-ink">{topCategory.name} · {Math.round(topCategory.share * 100)}% of this month</p>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums text-ink">{formatMoney(topCategory.value)}</span>
              </Link>
            )}
            <CategoryBars transactions={thisMonth} />
          </Section>
        ))}

      {transactions.length === 0 && loaded && (
        <p className="px-1 pb-2 text-center text-xs text-ink-3">
          Tips show up here once you have a month of spending.
        </p>
      )}
    </main>
  );
}
