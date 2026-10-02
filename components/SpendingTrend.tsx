"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useMemo } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { useWeekStart } from "@/hooks/useWeekStart";
import { spendTrend, type PeriodKey } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";

function axisLabel(label: string): string {
  const parts = label.split(" · ");
  return parts.length > 1 ? parts[1] : label;
}

export default function SpendingTrend({ period }: { period: PeriodKey }) {
  const { transactions } = useExpenses();
  const { weekStart } = useWeekStart();
  const data = useMemo(
    () => spendTrend(transactions, period, weekStart),
    [transactions, period, weekStart]
  );

  if (data.length === 0 || data.every((point) => point.spend === 0)) {
    return (
      <div className="flex h-52 items-center justify-center text-sm text-ink-3">
        No activity in this period
      </div>
    );
  }

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart accessibilityLayer data={data} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="2 5"
            stroke="var(--line)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--ink-3)", fontSize: 10 }}
            tickFormatter={axisLabel}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "var(--ink-3)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
            }
          />
          <Tooltip
            formatter={((v: unknown) => [
              formatMoney(Number(v ?? 0)),
              "Spent",
            ]) as never}
            contentStyle={{
              background: "var(--panel)",
              border: "1px solid var(--line-strong)",
              borderRadius: 14,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--ink-2)" }}
          />
          <Bar
            dataKey="spend"
            name="Out"
            fill="var(--accent)"
            radius={[6, 6, 0, 0]}
            maxBarSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
