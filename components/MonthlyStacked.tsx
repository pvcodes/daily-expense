"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Transaction } from "@/lib/types";
import { categoryColor } from "@/lib/types";
import { categoryMonthMatrix } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";

export default function MonthlyStacked({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const { data, cats } = useMemo(() => {
    const m = categoryMonthMatrix(transactions, 6);
    const cats = m.rows.slice(0, 6).map((r) => r.name);
    const data = m.labels.map((label, i) => {
      const point: Record<string, string | number> = { label };
      for (const r of m.rows.slice(0, 6)) point[r.name] = Math.round(r.values[i]);
      return point;
    });
    return { data, cats, total: m.grandTotal };
  }, [transactions]);

  if (data.every((d) => Object.keys(d).length === 1)) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-ink-3">
        No expenses in the last 6 months
      </div>
    );
  }

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--ink-3)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--ink-3)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={36}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
            }
          />
          <Tooltip
            formatter={((v: unknown) => formatMoney(Number(v ?? 0))) as never}
            contentStyle={{
              background: "var(--panel)",
              border: "1px solid var(--line-strong)",
              borderRadius: 10,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--ink-2)" }}
          />
          {cats.map((c, i) => (
            <Bar
              key={c}
              dataKey={c}
              stackId="stack"
              fill={categoryColor(c)}
              radius={i === cats.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              maxBarSize={28}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
