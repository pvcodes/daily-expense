"use client";

import { useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useExpenses } from "@/hooks/useExpenses";
import { CategoryBars } from "@/components/Charts";
import AddExpense from "@/components/AddExpense";
import MonthSummary from "@/components/MonthSummary";
import WeeklyBudget from "@/components/WeeklyBudget";
import { EmptyState, Section, Skeleton } from "@/components/ui";
import { useHomeWidgets } from "@/hooks/useHomeWidgets";
import { CATEGORY_COLORS } from "@/lib/types";
import { currentMonthKey, type PeriodKey } from "@/lib/analytics";
import { formatMoney, formatDate, formatTime } from "@/lib/format";
import { useSyncedPref } from "@/hooks/useSyncedPref";

const SpendingTrend = dynamic(
  () => import("@/components/SpendingTrend"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-52 w-full" />,
  }
);

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "quarter", label: "Quarter" },
  { key: "year", label: "Year" },
  { key: "all", label: "All" },
];

export default function HomePage() {
  const { transactions, loaded } = useExpenses();
  const { enabled } = useHomeWidgets();
  const [period, setPeriod] = useSyncedPref<PeriodKey>(
    "expense-tracker.period",
    "month"
  );

  const monthKey = useMemo(() => currentMonthKey(), []);
  const thisMonth = useMemo(
    () => transactions.filter((t) => t.date.startsWith(monthKey)),
    [transactions, monthKey]
  );

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
    <main className="flex-1 space-y-5 p-4 pt-4">
      <MonthSummary />

      {enabled.has("weeklyBudget") && (
        <WeeklyBudget />
      )}

      {enabled.has("addExpense") && <AddExpense />}

      {enabled.has("spendingTrend") &&
        (loading ? (
          <Section>
            <Skeleton className="h-52 w-full" />
          </Section>
        ) : (
          <Section
            title="Spending"
            aside={
              <div className="flex flex-wrap justify-end gap-1">
                {PERIODS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPeriod(p.key)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      period === p.key
                        ? "bg-accent text-accent-ink"
                        : "text-ink-3 hover:text-ink"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            }
          >
            <SpendingTrend period={period} />
            {period === "month" && (
              <p className="mt-1 text-center text-[11px] text-ink-3">
                This month, broken into weeks
              </p>
            )}
            {period === "day" && (
              <p className="mt-1 text-center text-[11px] text-ink-3">Last 30 days</p>
            )}
          </Section>
        ))}

      {enabled.has("categoryBars") &&
        (loading ? (
          <Section>
            <Skeleton className="h-40 w-full" />
          </Section>
        ) : (
          <Section title="Where you spent">
            <CategoryBars transactions={thisMonth} />
          </Section>
        ))}

      {enabled.has("recent") &&
        (loading ? (
          <Section>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="mb-2 h-10 w-full" />
            ))}
          </Section>
        ) : (
          <Section
            title="Recent"
            aside={
              <Link
                href="/transactions"
                className="rounded-lg px-2 py-1 text-xs text-accent-strong"
              >
                See all
              </Link>
            }
          >
            {recent.length === 0 ? (
              <EmptyState
                title="No transactions yet"
                hint="Add your first expense or import a CSV from Settings."
                action={
                  <Link
                    href="/settings"
                    className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-accent-ink"
                  >
                    Import on Settings
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-line">
                {recent.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/transactions/${t.id}`}
                      className="flex items-center gap-3 py-2.5 active:bg-panel-2"
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          background: CATEGORY_COLORS[t.category] || "#64748b",
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm">{t.notes || t.category}</div>
                        <div className="text-xs text-ink-3">
                          {formatDate(t.date)}
                          {t.time && t.time !== "00:00" ? ` · ${formatTime(t.time)}` : ""}{" "}
                          · {t.category}
                        </div>
                      </div>
                      <div className="text-sm font-semibold tabular-nums text-rose-500 dark:text-rose-400">
                        {formatMoney(t.price)}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
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