import test from "node:test";
import assert from "node:assert/strict";
import { isFutureDateTime, localDateTimeInput, money } from "./format.ts";

test("formats the current time as a zero-padded local wall-clock value", () => {
  assert.match(localDateTimeInput(), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  assert.match(localDateTimeInput("2026-03-05T04:05:00.000Z"), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
});

test("flags only future wall-clock values", () => {
  assert.equal(isFutureDateTime("2000-01-01T00:00"), false);
  assert.equal(isFutureDateTime("2999-12-31T23:59"), true);
  // The current minute is not in the future.
  assert.equal(isFutureDateTime(localDateTimeInput()), false);
});

test("compares dates across day and month boundaries", () => {
  assert.equal(isFutureDateTime("9999-01-01T00:00"), true);
  assert.equal(isFutureDateTime("0001-01-01T00:00"), false);
});

test("formats money with currency-specific fraction digits", () => {
  assert.equal(money("12.5", "INR"), "₹12.50");
  assert.match(money(1000, "USD"), /1,000\.00/);
});
