"use client";

import Link from "next/link";
import { useMonthlyBudget } from "@/hooks/useMonthlyBudget";
import { formatMoney } from "@/lib/format";
import { currentMonthLabel } from "@/lib/analytics";

export default function MonthlyBudget() {
  const { budget, spent } = useMonthlyBudget();

  const now = new Date();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();
  const dayOfMonth = now.getDate();
  const monthPct = Math.round((dayOfMonth / daysInMonth) * 100);

  if (budget <= 0) {
    return (
      <div className="card flex items-center justify-between gap-3 border-dashed p-4">
        <div>
          <p className="text-sm font-medium text-ink">Monthly budget</p>
          <p className="mt-0.5 text-xs text-ink-3">
            Set a target to track your {currentMonthLabel()} spending.
          </p>
        </div>
        <Link
          href="/settings"
          className="shrink-0 rounded-full btn-primary px-3 py-1.5 text-xs"
        >
          Set budget
        </Link>
      </div>
    );
  }

  const pct = Math.round((spent / budget) * 100);
  const over = spent > budget;
  const near = !over && pct >= 80;
  const fill = over
    ? "bg-bad"
    : near
      ? "bg-amber-500"
      : "bg-accent";
  // Ahead of pace if you've spent a larger share of the budget than of the month.
  const aheadOfPace = !over && pct > monthPct + 10;

  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-3">
          {currentMonthLabel()} budget
        </p>
        <p
          className={
            over
              ? "text-xs font-semibold text-bad"
              : near
                ? "text-xs font-semibold text-amber-500"
                : "text-xs text-ink-3"
          }
        >
          {over
            ? `Over by ${formatMoney(spent - budget)}`
            : `${formatMoney(budget - spent)} left`}
        </p>
      </div>
      <p className="mt-1 text-2xl font-bold tabular-nums text-ink">
        {formatMoney(spent)}{" "}
        <span className="text-sm font-medium text-ink-3">
          of {formatMoney(budget)}
        </span>
      </p>
      <div className="relative mt-3 h-2.5 overflow-visible rounded-full bg-panel-2">
        <div
          className={`h-full rounded-full transition-all ${fill}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
        <div
          className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-ink-3/60"
          style={{ left: `${monthPct}%` }}
          title={`Day ${dayOfMonth} of ${daysInMonth}`}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-ink-3">
        <span>Day {dayOfMonth} of {daysInMonth}</span>
        <span>
          {over
            ? "Over budget"
            : aheadOfPace
              ? "Spending ahead of pace"
              : pct >= 80
                ? "Almost at budget"
                : "On track"}
        </span>
      </div>
    </div>
  );
}
