"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { Transaction } from "@/lib/types";
import { categoryColor } from "@/lib/types";
import { aggregateByCategory } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";

export default function CategoryDonut({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const data = useMemo(() => aggregateByCategory(transactions).slice(0, 7), [transactions]);
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-ink-3">
        No expenses this month
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={3}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.name} fill={categoryColor(d.name)} />
              ))}
            </Pie>
            <Tooltip
              formatter={((v: unknown) => formatMoney(Number(v ?? 0))) as never}
              contentStyle={{
                background: "var(--panel)",
                border: "1px solid var(--line-strong)",
                borderRadius: 10,
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-medium uppercase tracking-wider text-ink-3">
            Total
          </span>
          <span className="text-base font-bold tabular-nums text-ink">
            {formatMoney(total)}
          </span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: categoryColor(d.name) }}
            />
            <span className="min-w-0 flex-1 truncate text-ink-2">{d.name}</span>
            <span className="shrink-0 tabular-nums text-ink-3">
              {Math.round((d.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
