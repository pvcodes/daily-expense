import { describe, it, expect } from "vitest";
import {
  parsePrice,
  parseCSV,
  exportExpensesCSV,
  exportJSON,
} from "./import";

describe("parsePrice", () => {
  it("handles empty / null / junk", () => {
    expect(parsePrice(null)).toBe(0);
    expect(parsePrice("")).toBe(0);
    expect(parsePrice("abc")).toBe(0);
  });
  it("handles comma as decimal separator when no dot present", () => {
    expect(parsePrice("-12,34")).toBe(-12.34);
    expect(parsePrice("1,5")).toBe(1.5);
  });
  it("handles comma as thousands separator when a dot is present", () => {
    expect(parsePrice("12,345.67")).toBe(12345.67);
  });
  it("parses plain decimals and negatives", () => {
    expect(parsePrice("-1000.5")).toBe(-1000.5);
    expect(parsePrice("500")).toBe(500);
  });
});

describe("parseCSV — expenses (4-col) format", () => {
  const EXPENSES = `Date,Category,Price,Notes
2026-09-01,Food,-120.5,"Lunch with, team"
2026-09-02 14:30:00,Transport,-40.0,"say ""hi"", ok"
2026-08-31,No Category,0,`;

  it("parses rows, defaults time/category, trims, handles quotes", () => {
    const res = parseCSV(EXPENSES, "file.csv");
    expect(res.errors).toEqual([]);
    expect(res.transactions).toHaveLength(3);
    const [a, b, c] = res.transactions;
    expect(a).toMatchObject({ date: "2026-09-01", time: "00:00", category: "Food", price: -120.5, notes: "Lunch with, team" });
    expect(b).toMatchObject({ date: "2026-09-02", time: "14:30:00", category: "Transport", price: -40, notes: 'say "hi", ok' });
    expect(c).toMatchObject({ category: "No Category", price: 0, notes: "" });
  });

  it("round-trips through exportExpensesCSV", () => {
    const res = parseCSV(EXPENSES, "f.csv");
    const out = parseCSV(exportExpensesCSV(res.transactions), "out.csv");
    expect(out.transactions.length).toBe(res.transactions.length);
    for (let i = 0; i < res.transactions.length; i++) {
      expect(out.transactions[i]).toMatchObject({
        date: res.transactions[i].date,
        time: res.transactions[i].time,
        category: res.transactions[i].category,
        price: res.transactions[i].price,
        notes: res.transactions[i].notes,
      });
    }
  });

  it("supports semicolon delimiter", () => {
    const res = parseCSV("Date;Category;Price;Notes\n2026-09-01;Food;-5;ok", "f.csv");
    expect(res.transactions[0]).toMatchObject({ category: "Food", price: -5 });
  });
});

describe("parseCSV — legacy format", () => {
  it("maps legacy columns (Account/Amount/Currency/CategoryName/Title)", () => {
    const LEGACY = `Account,Amount,Currency,CategoryName,Title,Date
visa,-2500.0,INR,Food,Roti shop,2024-03-31 12:00:00
visa,100.0,INR,Salary,Bonus,03/15/2024 09:30`;

    const res = parseCSV(LEGACY, "legacy.csv");
    expect(res.errors).toEqual([]);
    expect(res.transactions).toHaveLength(2);
    const [a, b] = res.transactions;
    expect(a).toMatchObject({ date: "2024-03-31", time: "12:00:00", category: "Food", price: -2500, notes: "Roti shop", currency: "INR" });
    expect(b).toMatchObject({ date: "2024-03-15", time: "09:30", price: 100 });
  });
});

describe("parseCSV — error paths", () => {
  it("reports empty files and unknown headers", () => {
    const empty = parseCSV("", "e.csv");
    expect(empty.errors).toEqual(["File is empty"]);

    const bad = parseCSV("Foo,Bar\n1,2", "b.csv");
    expect(bad.errors.length).toBe(1);
    expect(bad.errors[0]).toMatch(/Unrecognized header/);
  });

  it("skips blank lines and rows that are entirely empty", () => {
    const res = parseCSV("Date,Category,Price,Notes\n\n2026-09-01,Food,-1,x\n", "b.csv");
    expect(res.transactions).toHaveLength(1);
  });
});

describe("exportJSON", () => {
  it("serializes transactions", () => {
    const txs = parseCSV("Date,Category,Price,Notes\n2026-09-01,Food,-1,x", "f.csv").transactions;
    expect(JSON.parse(exportJSON(txs))).toHaveLength(1);
  });
});