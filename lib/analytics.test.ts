import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { 
  monthKey,
  monthLabel,
  aggregateByMonth,
  aggregateByCategory,
  aggregateByPeriod,
  slicePeriodData,
  currentMonthKey,
  currentMonthLabel,
  monthSummary,
  monthDelta,
  currentWeekStartISO,
  currentMonthWeeks,
  spendTrend,
} from "./analytics";
import type { Transaction } from "./types";

function tx(date: string, price: number, category = "Food"): Transaction {
  return {
    id: `t-${date}-${category}-${price}`,
    date,
    time: "00:00",
    category,
    price,
    currency: "INR",
    notes: "",
  };
}

describe("monthKey / monthLabel", () => {
  it("slices yyyy-MM-dd into yyyy-MM", () => {
    expect(monthKey("2026-09-05")).toBe("2026-09");
  });
  it("labels a month key", () => {
    expect(monthLabel("2026-09")).toBe("Sep 2026");
    expect(monthLabel("2026-01")).toBe("Jan 2026");
  });
});

describe("aggregateByMonth", () => {
  it("groups by month, separates spend/income, sorts ascending", () => {
    const txs = [
      tx("2026-08-10", -100),
      tx("2026-09-01", -50),
      tx("2026-09-02", 200),
    ];
    const points = aggregateByMonth(txs);
    expect(points.map((p) => p.month)).toEqual(["2026-08", "2026-09"]);
    expect(points[0]).toMatchObject({ spend: 100, income: 0 });
    expect(points[1]).toMatchObject({ spend: 50, income: 200 });
  });
});

describe("aggregateByCategory", () => {
  it("aggregates negative prices only, sorted by value desc", () => {
    const txs = [
      tx("2026-09-01", -100, "Food"),
      tx("2026-09-02", -50, "Rent"),
      tx("2026-09-03", -75, "Food"),
      tx("2026-09-04", 500, "Salary"),
    ];
    const slices = aggregateByCategory(txs);
    expect(slices).toEqual([
      { name: "Food", value: 175, count: 2 },
      { name: "Rent", value: 50, count: 1 },
    ]);
  });
  it("includes income when includeIncome is true", () => {
    const txs = [tx("2026-09-01", -100, "Food"), tx("2026-09-02", 500, "Salary")];
    expect(aggregateByCategory(txs, true)).toEqual([
      { name: "Salary", value: 500, count: 1 },
      { name: "Food", value: 100, count: 1 },
    ]);
  });
});

describe("aggregateByPeriod", () => {
  const txs = [
    tx("2026-08-29", -10),
    tx("2026-08-30", -20),
    tx("2026-08-31", -40),
    tx("2026-09-01", -80),
  ];

  it("groups by ISO week-start key using Monday default", () => {
    const pts = aggregateByPeriod(txs, "week");
    // 2026-08-29 = Sat, 08-30 = Sun, 08-31 = Mon, 09-01 = Tue
    const spend = Object.fromEntries(pts.map((p) => [p.key, p.spend]));
    expect(spend).toEqual({
      "2026-08-24": 30,
      "2026-08-31": 120,
    });
  });

  it("groups by Sunday week-start when configured", () => {
    const pts = aggregateByPeriod(txs, "week", "sunday");
    const spend = Object.fromEntries(pts.map((p) => [p.key, p.spend]));
    expect(spend).toEqual({
      "2026-08-23": 10,
      "2026-08-30": 140,
    });
  });

  it("groups by day", () => {
    const pts = aggregateByPeriod(
      [tx("2026-09-01", -10), tx("2026-09-02", -20), tx("2026-09-02", -30)],
      "day"
    );
    expect(pts.map((p) => p.key)).toEqual(["2026-09-01", "2026-09-02"]);
    expect(pts[1]).toMatchObject({ spend: 50 });
  });

  it("groups by quarter and year", () => {
    const q = aggregateByPeriod([tx("2026-01-01", -1), tx("2026-04-01", -1)], "quarter");
    expect(q.map((p) => p.key)).toEqual(["2026-Q1", "2026-Q2"]);
    const y = aggregateByPeriod([tx("2026-01-01", -1), tx("2027-01-01", -1)], "year");
    expect(y.map((p) => p.key)).toEqual(["2026", "2027"]);
  });

  it("collapses to a single point for 'all'", () => {
    const pts = aggregateByPeriod(txs, "all");
    expect(pts).toHaveLength(1);
    expect(pts[0]).toMatchObject({ key: "all", spend: 150 });
  });
});

describe("slicePeriodData", () => {
  it("passes everything through for 'all'", () => {
    const points = [{ key: "a" }, { key: "b" }];
    expect(slicePeriodData(points, "all", 8)).toBe(points);
  });
  it("keeps the last N otherwise", () => {
    const points = [{ key: "a" }, { key: "b" }, { key: "c" }];
    expect(slicePeriodData(points, "week", 2)).toEqual([{ key: "b" }, { key: "c" }]);
  });
});

describe("now-dependent helpers (frozen to 2026-09-01)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 1, 12, 0, 0));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("currentMonthKey / currentMonthLabel", () => {
    expect(currentMonthKey()).toBe("2026-09");
    expect(currentMonthLabel()).toBe("Sep 2026");
  });

  it("currentWeekStartISO respects the configured start day", () => {
    expect(currentWeekStartISO("monday")).toBe("2026-08-31");
    expect(currentWeekStartISO("sunday")).toBe("2026-08-30");
  });

  it("monthSummary filters to the current month", () => {
    const txs = [tx("2026-09-01", -100), tx("2026-09-30", -50), tx("2026-08-31", -999), tx("2026-09-02", 300)];
    expect(monthSummary(txs)).toEqual({ spend: 150, income: 300, net: 150 });
  });

  it("monthDelta compares to last month and nulls when no previous", () => {
    const txs = [tx("2026-09-01", -150), tx("2026-08-01", -300)];
    expect(monthDelta(txs)).toEqual({ pct: -50, current: 150, previous: 300 });
    expect(monthDelta([tx("2026-09-01", -150)])).toEqual({ pct: null, current: 150, previous: 0 });
  });

  it("currentMonthWeeks buckets txs into week points starting Mon Aug 31", () => {
    const txs = [
      tx("2026-08-30", -10), // before the month window — excluded
      tx("2026-08-31", -20), // before first of month — excluded
      tx("2026-09-01", -30),
    ];
    const pts = currentMonthWeeks(txs, "monday");
    expect(pts.length).toBeGreaterThanOrEqual(5);
    expect(pts[0].key).toBe("2026-08-31");
    expect(pts[0].spend).toBe(30); // 09-01 falls in the first week's range
    expect(pts.every((p) => p.label.startsWith("Sep 2026"))).toBe(true);
  });

  it("spendTrend delegates by period", () => {
    const txs = [
      tx("2026-09-01", -10),
      tx("2026-09-02", -20),
    ];
    const months = spendTrend(txs, "all");
    expect(months).toHaveLength(1);
    expect(months[0]).toMatchObject({ key: "2026-09", spend: 30 });

    const weeks = spendTrend(txs, "month");
    expect(weeks).toEqual(currentMonthWeeks(txs, "monday"));
  });

  it("spendTrend day returns the last 30 daily buckets", () => {
    const txs: Transaction[] = [];
    const end = new Date(Date.UTC(2026, 9, 29)); // 2026-10-29
    for (let i = 0; i < 60; i++) {
      const d = new Date(end);
      d.setUTCDate(end.getUTCDate() - i);
      txs.push(
        tx(d.toISOString().slice(0, 10), -i)
      );
    }
    const pts = spendTrend(txs, "day");
    expect(pts).toHaveLength(30);
    expect(pts[0].key).toBe("2026-09-30");
    expect(pts[29].key).toBe("2026-10-29");
  });
});