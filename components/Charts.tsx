"use client";

import { useMemo } from "react";
import type { Transaction } from "@/lib/types";
import { categoryColor } from "@/lib/types";
import { aggregateByCategory } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";

export function CategoryBars({ transactions }: { transactions: Transaction[] }) {
  const data = useMemo(
    () => aggregateByCategory(transactions),
    [transactions]
  );
  const total = useMemo(
    () => data.reduce((s, x) => s + x.value, 0),
    [data]
  );
  if (data.length === 0) return <Empty label="No expenses yet" />;
  const top = data.slice(0, 5);
  const otherValue = data.slice(5).reduce((sum, d) => sum + d.value, 0);
  const rows = otherValue > 0
    ? [...top, { name: "Other", value: otherValue, count: data.slice(5).reduce((sum, d) => sum + d.count, 0) }]
    : top;
  const max = rows[0].value;

  return (
    <div className="space-y-3">
      {rows.map((d) => {
        const color = d.name === "Other" ? "var(--ink-3)" : categoryColor(d.name);
        const pct = Math.round((d.value / total) * 100);
        return (
          <div key={d.name}>
            <div className="mb-1 flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: color }}
              />
              <span className="min-w-0 flex-1 truncate text-ink">{d.name}</span>
              <span className="shrink-0 min-w-9 text-right text-xs tabular-nums text-ink-3">{pct}%</span>
              <span className="shrink-0 text-sm font-bold tabular-nums">
                {formatMoney(d.value)}
              </span>
            </div>
            <div className="ml-[1.125rem] h-2 overflow-hidden rounded-full bg-panel-2">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(2, (d.value / max) * 100)}%`,
                  background: color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex h-24 items-center justify-center text-sm text-ink-3">
      {label}
    </div>
  );
}
