"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
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

  if (data.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center text-sm text-ink-3">
        No data yet
      </div>
    );
  }

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--accent)"
                stopOpacity={0.32}
              />
              <stop
                offset="100%"
                stopColor="var(--accent)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--line-strong)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--ink-3)", fontSize: 10 }}
            tickFormatter={axisLabel}
            axisLine={{ stroke: "var(--line-strong)" }}
            tickLine={false}
            interval="preserveStartEnd"
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
            formatter={((v: unknown) => [
              formatMoney(Number(v ?? 0)),
              "Spent",
            ]) as never}
            contentStyle={{
              background: "var(--panel)",
              border: "1px solid var(--line-strong)",
              borderRadius: 12,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--ink-2)" }}
          />
          <Area
            type="monotone"
            dataKey="spend"
            stroke="var(--accent)"
            strokeWidth={2.5}
            fill="url(#trendFill)"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}