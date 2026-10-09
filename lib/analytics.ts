import type { Transaction } from "./types";

export interface MonthPoint {
  month: string;
  label: string;
  spend: number;
}

export interface PeriodPoint {
  key: string;
  label: string;
  spend: number;
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
  const map = new Map<string, number>();
  for (const t of txs) {
    if (t.includeInAnalysis === false) continue;
    if (t.price >= 0) continue;
    const key = monthKey(t.date);
    map.set(key, (map.get(key) || 0) - t.price);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, v]) => ({
      month,
      label: monthLabel(month),
      spend: v,
    }));
}

export function aggregateByCategory(
  txs: Transaction[]
): CategorySlice[] {
  const map = new Map<string, { value: number; count: number }>();
  for (const t of txs) {
    if (t.includeInAnalysis === false) continue;
    if (t.price < 0) {
      const entry = map.get(t.category) || { value: 0, count: 0 };
      entry.value += -t.price;
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
    for (const t of txs) {
      if (t.includeInAnalysis === false) continue;
      if (t.date >= from && t.date <= to) {
        if (t.price < 0) spend += -t.price;
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
  const map = new Map<string, number>();
  for (const t of txs) {
    if (t.includeInAnalysis === false) continue;
    if (t.price >= 0) continue;
    let key = monthKey(t.date);
    if (period === "week") key = weekKey(t.date, weekStart);
    else if (period === "day") key = t.date;
    else if (period === "quarter") key = quarterKey(t.date);
    else if (period === "year") key = t.date.slice(0, 4);
    else if (period === "all") key = "all";
    map.set(key, (map.get(key) || 0) - t.price);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, spend]) => ({ key, label: periodLabel(key, period), spend }));
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

export function monthSummary(txs: Transaction[]): { spend: number } {
  const key = currentMonthKey();
  let spend = 0;
  for (const t of txs) {
    if (t.includeInAnalysis === false) continue;
    if (!t.date.startsWith(key)) continue;
    if (t.price < 0) spend += -t.price;
  }
  return { spend };
}

export function monthDelta(txs: Transaction[]): {
  pct: number | null;
  current: number;
  previous: number;
  difference: number;
} {
  const now = new Date();
  const key = currentMonthKey();
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevKey = `${prevDate.getFullYear()}-${String(
    prevDate.getMonth() + 1
  ).padStart(2, "0")}`;
  const previousCutoff = Math.min(
    now.getDate(),
    new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 0).getDate()
  );
  let current = 0;
  let previous = 0;
  for (const t of txs) {
    if (t.includeInAnalysis === false) continue;
    if (t.price >= 0) continue;
    const day = Number(t.date.slice(8, 10));
    if (t.date.startsWith(key) && day <= now.getDate()) current += -t.price;
    else if (t.date.startsWith(prevKey) && day <= previousCutoff) previous += -t.price;
  }
  const pct =
    previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;
  return { pct, current, previous, difference: current - previous };
}

export interface SpendingPace {
  current: number;
  projected: number | null;
  recentAverage: number | null;
  historyMonths: number;
  monthDays: number;
  elapsedDays: number;
}

/** Current-month pace compared with up to three completed, recorded months. */
export function spendingPace(
  txs: Transaction[],
  now = new Date()
): SpendingPace {
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const elapsedDays = now.getDate();
  let current = 0;
  const monthTotals = new Map<string, number>();
  const monthActivity = new Set<string>();
  for (const tx of txs) {
    if (tx.includeInAnalysis === false) continue;
    const key = tx.date.slice(0, 7);
    monthActivity.add(key);
    if (tx.price < 0 && key === currentKey && Number(tx.date.slice(8, 10)) <= elapsedDays) {
      current += -tx.price;
    } else if (tx.price < 0) {
      monthTotals.set(key, (monthTotals.get(key) ?? 0) - tx.price);
    }
  }

  const priorKeys = Array.from({ length: 3 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (i + 1), 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }).filter((key) => monthActivity.has(key));
  const historyMonths = priorKeys.length;
  const recentAverage = historyMonths >= 2
    ? priorKeys.reduce((sum, key) => sum + (monthTotals.get(key) ?? 0), 0) / historyMonths
    : null;
  const projected = recentAverage === null || elapsedDays === 0
    ? null
    : current / elapsedDays * monthDays;

  return { current, projected, recentAverage, historyMonths, monthDays, elapsedDays };
}

export function currentMonthTopCategory(txs: Transaction[]): (CategorySlice & { share: number }) | null {
  const key = currentMonthKey();
  const categories = aggregateByCategory(
    txs.filter((tx) => tx.date.startsWith(key))
  );
  const total = categories.reduce((sum, category) => sum + category.value, 0);
  const top = categories[0];
  return !top || total === 0 ? null : { ...top, share: top.value / total };
}

export interface MonthCategoryRow {
  name: string;
  values: number[];
  total: number;
}

export function categoryMonthMatrix(
  txs: Transaction[],
  monthCount = 6
): {
  months: string[];
  labels: string[];
  rows: MonthCategoryRow[];
  monthTotals: number[];
  grandTotal: number;
} {
  const now = new Date();
  const months: string[] = [];
  const labels: string[] = [];
  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
    labels.push(MONTHS[d.getMonth()]);
  }
  const cell = new Map<string, number[]>();
  const monthTotals = new Array<number>(monthCount).fill(0);
  for (const t of txs) {
    if (t.includeInAnalysis === false) continue;
    if (t.price >= 0) continue;
    const idx = months.indexOf(t.date.slice(0, 7));
    if (idx === -1) continue;
    let values = cell.get(t.category);
    if (!values) {
      values = new Array<number>(monthCount).fill(0);
      cell.set(t.category, values);
    }
    const v = -t.price;
    values[idx] += v;
    monthTotals[idx] += v;
  }
  const rows = [...cell.entries()]
    .map(([name, values]) => ({
      name,
      values,
      total: values.reduce((s, v) => s + v, 0),
    }))
    .sort((a, b) => b.total - a.total);
  return {
    months,
    labels,
    rows,
    monthTotals,
    grandTotal: monthTotals.reduce((s, v) => s + v, 0),
  };
}

export function spendTrend(
  txs: Transaction[],
  period: PeriodKey,
  weekStart: WeekStart = DEFAULT_WEEK_START
): PeriodPoint[] {
  if (period === "all") {
    const monthly = new Map(aggregateByMonth(txs).map((m) => [m.month, m]));
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const point = monthly.get(key);
      return {
        key,
        label: MONTHS[date.getMonth()],
        spend: point?.spend ?? 0,
      };
    });
  }
  if (period === "month") return currentMonthWeeks(txs, weekStart);
  if (period === "day") {
    const byDay = new Map(
      aggregateByPeriod(txs, "day", weekStart).map((point) => [point.key, point])
    );
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const point = byDay.get(key);
      return {
        key,
        label: `${MONTHS[date.getMonth()]} ${date.getDate()}`,
        spend: point?.spend ?? 0,
      };
    });
  }
  const count = period === "year" ? 6 : 8;
  return slicePeriodData(aggregateByPeriod(txs, period, weekStart), period, count);
}
