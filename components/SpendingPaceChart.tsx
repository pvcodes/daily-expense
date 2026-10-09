"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SpendingPace } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";

export default function SpendingPaceChart({ pace }: { pace: SpendingPace }) {
  if (pace.projected === null || pace.recentAverage === null) return null;

  const data = [
    { label: "Spent so far", amount: pace.current, color: "var(--ink-3)" },
    { label: "By month-end", amount: pace.projected, color: "var(--accent-text)" },
    { label: "Usual month", amount: pace.recentAverage, color: "var(--line-strong)" },
  ];

  return (
    <div className="mt-3 h-32 w-full" role="img" aria-label={`Spending chart: ${formatMoney(pace.current)} spent so far, ${formatMoney(pace.projected)} estimated by month-end, and a usual monthly average of ${formatMoney(pace.recentAverage)}.`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          accessibilityLayer
          data={data}
          layout="vertical"
          margin={{ top: 2, right: 64, bottom: 0, left: 0 }}
          barCategoryGap={8}
        >
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--ink-3)", fontSize: 10 }}
            tickFormatter={(value: number) => value >= 1000 ? `₹${Math.round(value / 1000)}k` : `₹${value}`}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={96}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--ink-2)", fontSize: 10 }}
          />
          <Tooltip
            formatter={((value: unknown) => [formatMoney(Number(value ?? 0)), "Spend"]) as never}
            contentStyle={{
              background: "var(--panel)",
              border: "1px solid var(--line-strong)",
              borderRadius: 12,
              fontSize: 12,
            }}
          />
          <Bar dataKey="amount" name="Spend" radius={[0, 6, 6, 0]} maxBarSize={16}>
            {data.map((point) => <Cell key={point.label} fill={point.color} />)}
            <LabelList
              dataKey="amount"
              position="right"
              formatter={(value) => formatMoney(Number(value ?? 0))}
              style={{ fill: "var(--ink-2)", fontSize: 10, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
