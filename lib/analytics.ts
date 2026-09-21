import type { Transaction } from "./types";

export interface MonthPoint {
  month: string;
  label: string;
  spend: number;
  income: number;
}

export interface PeriodPoint {
  key: string;
  label: string;
  spend: number;
  income: number;
}

export interface CategorySlice {
  name: string;
  value: number;
  count: number;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function monthKey(date: string): string {
  return date.slice(0, 7);
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

export function aggregateByMonth(txs: Transaction[]): MonthPoint[] {
  const map = new Map<string, { spend: number; income: number }>();
  for (const t of txs) {
    const key = monthKey(t.date);
    const entry = map.get(key) || { spend: 0, income: 0 };
    if (t.price >= 0) entry.income += t.price;
    else entry.spend += -t.price;
    map.set(key, entry);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, v]) => ({
      month,
      label: monthLabel(month),
      spend: v.spend,
      income: v.income,
    }));
}

export function aggregateByCategory(
  txs: Transaction[],
  includeIncome = false
): CategorySlice[] {
  const map = new Map<string, { value: number; count: number }>();
  for (const t of txs) {
    if (t.price < 0) {
      const entry = map.get(t.category) || { value: 0, count: 0 };
      entry.value += -t.price;
      entry.count += 1;
      map.set(t.category, entry);
    } else if (includeIncome && t.price > 0) {
      const entry = map.get(t.category) || { value: 0, count: 0 };
      entry.value += t.price;
      entry.count += 1;
      map.set(t.category, entry);
    }
  }
  return [...map.entries()]
    .map(([name, v]) => ({ name, value: v.value, count: v.count }))
    .sort((a, b) => b.value - a.value);
}

export type PeriodKey = "day" | "week" | "month" | "quarter" | "year" | "all";

export type WeekStart = "monday" | "sunday";
export const DEFAULT_WEEK_START: WeekStart = "monday";

function weekOffset(isoDate: string, weekStart: WeekStart): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const target = weekStart === "sunday" ? 0 : 1;
  return (dayOfWeek - target + 7) % 7;
}

function weekKey(date: string, weekStart: WeekStart): string {
  const [y, m, d] = date.split("-").map(Number);
  const startMs = Date.UTC(y, m - 1, d) - weekOffset(date, weekStart) * 86400000;
  return isoFromDate(new Date(startMs));
}

function weekRangeLabel(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, d));
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  const sm = MONTHS[start.getUTCMonth()];
  const em = MONTHS[end.getUTCMonth()];
  if (sm === em) {
    return `${start.getUTCDate()}–${end.getUTCDate()} ${sm}`;
  }
  return `${start.getUTCDate()} ${sm} – ${end.getUTCDate()} ${em}`;
}

export function currentWeekStartISO(weekStart: WeekStart = DEFAULT_WEEK_START): string {
  const now = new Date();
  const day = now.getDay();
  const target = weekStart === "sunday" ? 0 : 1;
  const d = new Date(now);
  d.setDate(now.getDate() - ((day - target + 7) % 7));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dayNum = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dayNum}`;
}

export function currentMonthWeeks(
  txs: Transaction[],
  weekStart: WeekStart = DEFAULT_WEEK_START
): PeriodPoint[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const first = new Date(Date.UTC(y, m, 1));
  const last = new Date(Date.UTC(y, m + 1, 0));
  const firstIso = isoFromDate(first);
  const lastIso = isoFromDate(last);
  const target = weekStart === "sunday" ? 0 : 1;

  const startDate = new Date(first);
  startDate.setUTCDate(
    startDate.getUTCDate() - ((first.getUTCDay() - target + 7) % 7)
  );

  const points: PeriodPoint[] = [];
  while (startDate.getTime() <= last.getTime()) {
    const endDate = new Date(startDate);
    endDate.setUTCDate(startDate.getUTCDate() + 6);
    const from = startDate < first ? firstIso : isoFromDate(startDate);
    const to = endDate > last ? lastIso : isoFromDate(endDate);
    let spend = 0;
    let income = 0;
    for (const t of txs) {
      if (t.date >= from && t.date <= to) {
        if (t.price >= 0) income += t.price;
        else spend += -t.price;
      }
    }
    const fromM = Number(from.slice(5, 7));
    const toM = Number(to.slice(5, 7));
    const inMonth = m + 1;
    const range =
      fromM === inMonth && toM === inMonth
        ? `${from.slice(8, 10)}–${to.slice(8, 10)}`
        : `${from.slice(8, 10)}/${fromM}–${to.slice(8, 10)}/${toM}`;
    points.push({
      key: isoFromDate(startDate),
      label: `${MONTHS[m]} ${y} · ${range}`,
      spend,
      income,
    });
    startDate.setUTCDate(startDate.getUTCDate() + 7);
  }
  return points;
}

function isoFromDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function quarterKey(date: string): string {
  const [y, m] = date.split("-").map(Number);
  return `${y}-Q${Math.floor((m - 1) / 3) + 1}`;
}

export function aggregateByPeriod(
  txs: Transaction[],
  period: PeriodKey,
  weekStart: WeekStart = DEFAULT_WEEK_START
): PeriodPoint[] {
  const map = new Map<string, { spend: number; income: number }>();
  for (const t of txs) {
    let key = monthKey(t.date);
    if (period === "week") key = weekKey(t.date, weekStart);
    else if (period === "day") key = t.date;
    else if (period === "quarter") key = quarterKey(t.date);
    else if (period === "year") key = t.date.slice(0, 4);
    else if (period === "all") key = "all";
    const entry = map.get(key) || { spend: 0, income: 0 };
    if (t.price >= 0) entry.income += t.price;
    else entry.spend += -t.price;
    map.set(key, entry);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, v]) => ({ key, label: periodLabel(key, period), spend: v.spend, income: v.income }));
}

function periodLabel(key: string, period: PeriodKey): string {
  if (period === "all") return "All time";
  if (period === "week") return weekRangeLabel(key);
  if (period === "day") {
    const d = Number(key.slice(8, 10));
    return `${d} ${MONTHS[Number(key.slice(5, 7)) - 1]}`;
  }
  if (period === "quarter") {
    const q = key.match(/(\d{4})-Q(\d)/);
    return q ? `Q${q[2]} ${q[1].slice(2)}` : key;
  }
  if (period === "year") return key;
  return monthLabel(key);
}

export function slicePeriodData<T>(points: T[], period: PeriodKey, count: number): T[] {
  if (period === "all") return points;
  return points.slice(-count);
}

export function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function currentMonthLabel(): string {
  const now = new Date();
  return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

export function monthSummary(txs: Transaction[]): {
  spend: number;
  income: number;
  net: number;
} {
  const key = currentMonthKey();
  let spend = 0;
  let income = 0;
  for (const t of txs) {
    if (!t.date.startsWith(key)) continue;
    if (t.price >= 0) income += t.price;
    else spend += -t.price;
  }
  return { spend, income, net: income - spend };
}

export function monthDelta(txs: Transaction[]): {
  pct: number | null;
  current: number;
  previous: number;
} {
  const now = new Date();
  const key = currentMonthKey();
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevKey = `${prevDate.getFullYear()}-${String(
    prevDate.getMonth() + 1
  ).padStart(2, "0")}`;
  let current = 0;
  let previous = 0;
  for (const t of txs) {
    if (t.price >= 0) continue;
    if (t.date.startsWith(key)) current += -t.price;
    else if (t.date.startsWith(prevKey)) previous += -t.price;
  }
  const pct =
    previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;
  return { pct, current, previous };
}

export function spendTrend(
  txs: Transaction[],
  period: PeriodKey,
  weekStart: WeekStart = DEFAULT_WEEK_START
): PeriodPoint[] {
  if (period === "all") {
    return aggregateByMonth(txs)
      .slice(-14)
      .map((m) => ({
        key: m.month,
        label: m.label,
        spend: m.spend,
        income: m.income,
      }));
  }
  if (period === "month") return currentMonthWeeks(txs, weekStart);
  if (period === "day") {
    return slicePeriodData(aggregateByPeriod(txs, "day", weekStart), "day", 30);
  }
  const count = period === "year" ? 6 : 8;
  return slicePeriodData(aggregateByPeriod(txs, period, weekStart), period, count);
}
