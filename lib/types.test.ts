import { describe, expect, it } from "vitest";
import {
  DEFAULT_CATEGORIES,
  categoryColor,
  isDefaultCategory,
  mergeCategories,
  normalizeCategory,
  sameCategory,
} from "./types";

describe("DEFAULT_CATEGORIES", () => {
  it("is the five-category starting set", () => {
    expect([...DEFAULT_CATEGORIES]).toEqual([
      "Eat Out",
      "Bills",
      "Transport",
      "Groceries",
      "Shopping",
    ]);
  });

  it("has no duplicates", () => {
    const lower = DEFAULT_CATEGORIES.map((c) => c.toLowerCase());
    expect(new Set(lower).size).toBe(lower.length);
  });
});

describe("normalizeCategory", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeCategory("  Coffee   Beans ")).toBe("Coffee Beans");
    expect(normalizeCategory("Tea\n\t")).toBe("Tea");
  });

  it("drops empties and caps the length", () => {
    expect(normalizeCategory("   ")).toBe("");
    expect(normalizeCategory("")).toBe("");
    expect(normalizeCategory("x".repeat(50))).toHaveLength(24);
  });
});

describe("sameCategory", () => {
  it("ignores case and surrounding space", () => {
    expect(sameCategory("Bills", " bills ")).toBe(true);
    expect(sameCategory("Bills", "Bills2")).toBe(false);
  });
});

describe("mergeCategories", () => {
  it("keeps the first spelling and drops case-insensitive duplicates", () => {
    expect(mergeCategories(["Bills", "Groceries"], ["bills", "Tea"])).toEqual([
      "Bills",
      "Groceries",
      "Tea",
    ]);
  });

  it("normalises entries and skips blanks", () => {
    expect(mergeCategories(["  Eat  Out ", "", "   ", "Bills"])).toEqual([
      "Eat Out",
      "Bills",
    ]);
  });
});

describe("isDefaultCategory", () => {
  it("recognises defaults regardless of case", () => {
    expect(isDefaultCategory("eat out")).toBe(true);
    expect(isDefaultCategory("Chai")).toBe(false);
  });
});

describe("categoryColor", () => {
  it("uses the fixed color for known categories", () => {
    expect(categoryColor("Bills")).toBe("#6366f1");
    expect(categoryColor("Eat Out")).toBe("#f97316");
  });

  it("is stable for unknown names", () => {
    expect(categoryColor("Coffee")).toBe(categoryColor("Coffee"));
  });

  it("spreads unknown names across the palette", () => {
    const colors = new Set(
      ["Coffee", "Pets", "Gym", "Books", "Travel", "Gifts"].map(categoryColor)
    );
    expect(colors.size).toBeGreaterThan(1);
  });

  it("always returns a hex color", () => {
    for (const name of ["", "???", "Bills", "Some Long Custom Name"]) {
      expect(categoryColor(name)).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
