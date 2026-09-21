"use client";

import Link from "next/link";
import { useWeeklyBudget } from "@/hooks/useWeeklyBudget";
import { formatMoney, formatDate } from "@/lib/format";

export default function WeeklyBudget() {
  const { budget, spent, weekStart, weekStartDate } = useWeeklyBudget();

  if (budget <= 0) {
    const dayLabel = weekStart === "sunday" ? "Sun" : "Mon";
    return (
      <div className="flex items-center justify-between gap-3 px-1 py-2">
        <p className="text-xs text-ink-3">
          No weekly budget. Week starts {dayLabel}, {formatDate(weekStartDate)}.
        </p>
        <Link
          href="/settings"
          className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink active:scale-[0.98]"
        >
          Set budget
        </Link>
      </div>
    );
  }

  const pct = Math.round((spent / budget) * 100);
  const over = spent > budget;
  const near = !over && pct >= 80;
  const fill = over ? "bg-red-500" : near ? "bg-amber-500" : "bg-accent";

  return (
    <div className="px-1 py-1">
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <p className="font-medium text-ink-2">
          Budget <span className="font-semibold text-ink">{formatMoney(spent)}</span>{" "}
          of {formatMoney(budget)}
        </p>
        <p
          className={
            over
              ? "font-semibold text-red-500"
              : near
                ? "font-semibold text-amber-600 dark:text-amber-400"
                : "text-ink-3"
          }
        >
          {over
            ? `Over by ${formatMoney(spent - budget)}`
            : `${formatMoney(budget - spent)} left`}
        </p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-panel-2">
        <div
          className={`h-full rounded-full transition-all ${fill}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}