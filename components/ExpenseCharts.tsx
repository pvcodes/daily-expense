"use client";

import { useMemo } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import type { Analytics } from "@/lib/types";
import { dateLabel, money } from "@/lib/format";

const chartColors = ["var(--chart-plum)", "var(--chart-coral)", "var(--chart-gold)", "var(--chart-blue)", "var(--chart-sage)", "var(--chart-berry)", "var(--chart-ochre)", "var(--chart-lilac)"];
const tooltipStyle = { borderRadius: 14, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", fontSize: 12 };
const barAxisPadding = 1.1;
const barAxisSteps = [1, 2, 2.5, 3, 4, 5, 6, 8, 10];

/** Bars can only share one currency at a time, so the ceiling is derived from values, not a fixed range. */
function barAxisScale(rows: { amount: number }[]): { domain: [number, number]; ticks: number[]; format: (value: number) => string } {
  const max = rows.reduce((result, row) => Math.max(result, Number(row.amount) || 0), 0);
  const padded = max * barAxisPadding;
  if (!Number.isFinite(padded) || padded <= 0) return { domain: [0, 1], ticks: [0, 1], format: (value) => String(value) };
  const magnitude = 10 ** Math.floor(Math.log10(padded / 4));
  const step = barAxisSteps.map((factor) => factor * magnitude).find((candidate) => candidate * 4 >= padded) || magnitude * 10;
  const upper = step * 4;
  return {
    domain: [0, upper],
    ticks: [0, step, step * 2, step * 3, upper],
    format: (value) => value >= 1000 ? `${Number((value / 1000).toFixed(1))}k` : step < 1 ? String(value) : String(Math.round(value))
  };
}

export function TrendChart({ analytics, currency, compact = false }: { analytics: Analytics; currency: string; compact?: boolean }) {
  const data = useMemo(() => analytics.months.filter((row) => row.currency === currency).map((row) => ({
    label: new Intl.DateTimeFormat("en", { month: "short" }).format(new Date(row.month + "-01T12:00:00")),
    amount: Number(row.amount)
  })), [analytics.months, currency]);
  return <div className={"chart-wrap" + (compact ? " chart-compact" : "")} role="img" aria-label={`Spending trend across six months, in ${currency}`}>
    <ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 12, right: 4, left: -22, bottom: 0 }}>
      <defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-plum)" stopOpacity={0.18} /><stop offset="100%" stopColor="var(--chart-plum)" stopOpacity={0.015} /></linearGradient></defs>
      <CartesianGrid stroke="var(--line)" strokeDasharray="2 5" vertical={false} />
      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} />
      <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 9 }} tickFormatter={(n) => n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n)} />
      <Tooltip formatter={(value) => [money(Number(value), currency), "Spending"]} contentStyle={tooltipStyle} />
      <Area type="monotone" dataKey="amount" stroke="var(--chart-plum)" strokeWidth={2.5} fill="url(#trendFill)" activeDot={{ r: 4, fill: "var(--chart-coral)", stroke: "var(--surface)", strokeWidth: 2 }} />
    </AreaChart></ResponsiveContainer>
  </div>;
}

export function CategoryDonut({ categories, currency }: { categories: Analytics["categories"]; currency: string }) {
  const data = useMemo(() => categories.filter((row) => row.currency === currency).map((row) => ({ ...row, amount: Number(row.amount) })), [categories, currency]);
  return <div className="chart-wrap donut-chart" role="img" aria-label={`Spending by category in ${currency}`}><ResponsiveContainer width="100%" height="100%"><PieChart>
    <Pie data={data} dataKey="amount" nameKey="category" innerRadius={60} outerRadius={88} paddingAngle={3} stroke="none">
      {data.map((row, index) => <Cell key={row.category} fill={chartColors[index % chartColors.length]} />)}
    </Pie><Tooltip formatter={(value) => money(Number(value), currency)} contentStyle={tooltipStyle} />
  </PieChart></ResponsiveContainer></div>;
}

export function DailyBars({ rows, currency }: { rows: Analytics["daily"]; currency: string }) {
  const data = useMemo(() => rows.map((row) => ({ ...row, amount: Number(row.amount) })), [rows]);
  const axis = useMemo(() => barAxisScale(data), [data]);
  return <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 12, right: 2, left: -22, bottom: 0 }}>
    <CartesianGrid stroke="var(--line)" strokeDasharray="2 5" vertical={false} />
    <XAxis dataKey="date" tickFormatter={(value) => String(value).slice(-2)} tickLine={false} axisLine={false} interval="preserveStartEnd" tick={{ fill: "var(--muted)", fontSize: 9 }} />
    <YAxis domain={axis.domain} ticks={axis.ticks} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 9 }} tickFormatter={axis.format} />
    <Tooltip labelFormatter={(value) => dateLabel(String(value) + "T00:00:00Z", { day: "numeric", month: "short" })} formatter={(value) => money(Number(value), currency)} contentStyle={tooltipStyle} />
    <Bar dataKey="amount" fill="var(--chart-coral)" radius={[5, 5, 0, 0]} maxBarSize={24} />
  </BarChart></ResponsiveContainer></div>;
}

export function WeekdayBars({ rows, currency }: { rows: Analytics["weekdays"]; currency: string }) {
  const data = useMemo(() => rows.map((row) => ({ ...row, amount: Number(row.amount) })), [rows]);
  const axis = useMemo(() => barAxisScale(data), [data]);
  return <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 12, right: 2, left: -22, bottom: 0 }}>
    <CartesianGrid stroke="var(--line)" strokeDasharray="2 5" vertical={false} />
    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} />
    <YAxis domain={axis.domain} ticks={axis.ticks} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 9 }} tickFormatter={axis.format} />
    <Tooltip formatter={(value) => [money(Number(value), currency), "Average"]} contentStyle={tooltipStyle} />
    <Bar dataKey="amount" fill="var(--chart-plum)" radius={[5, 5, 0, 0]} maxBarSize={28} />
  </BarChart></ResponsiveContainer></div>;
}
