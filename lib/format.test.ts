import { describe, it, expect } from "vitest";
import { formatMoney, formatDate, formatTime } from "./format";

describe("formatMoney", () => {
  it("formats INR with Indian digit grouping and no sign", () => {
    expect(formatMoney(123456, "INR")).toBe("₹1,23,456");
    expect(formatMoney(1234, "INR")).toBe("₹1,234");
    expect(formatMoney(-500, "INR")).toBe("₹500");
    expect(formatMoney(0, "INR")).toBe("₹0");
  });
  it("formats other currencies with 0 decimals ≥1000, else 2", () => {
    expect(formatMoney(1234.5, "USD")).toBe("$1,235");
    expect(formatMoney(12.5, "USD")).toBe("$12.50");
  });
  it("falls back to a plain string for invalid currencies", () => {
    expect(formatMoney(1234.5, "US")).toBe("1234.50 US");
  });
});

describe("formatDate", () => {
  it("converts yyyy-MM-dd to dd/MM/yyyy", () => {
    expect(formatDate("2026-09-01")).toBe("01/09/2026");
  });
  it("returns empty string for falsy input", () => {
    expect(formatDate("")).toBe("");
  });
});

describe("formatTime", () => {
  it("truncates to HH:mm", () => {
    expect(formatTime("14:35:22")).toBe("14:35");
  });
  it("returns empty string for falsy input", () => {
    expect(formatTime("")).toBe("");
  });
});