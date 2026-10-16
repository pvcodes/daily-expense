import test from "node:test";
import assert from "node:assert/strict";
import { buildTransactionSearch, likePattern, parseSearchQuery, tokenizeQuery } from "./search-query.ts";

test("parses the documented example query", () => {
  const parsed = parseSearchQuery("c:shop*, note:bubu, from:2026-01-01");
  assert.deepEqual(parsed.category, ["shop*"]);
  assert.deepEqual(parsed.note, ["bubu"]);
  assert.equal(parsed.from, "2026-01-01");
  assert.equal(parsed.to, null);
  assert.deepEqual(parsed.ignored, []);
  assert.deepEqual(parsed.tokens.map((token) => token.kind), ["category", "note", "from"]);
});

test("splits on commas and whitespace, keeps quoted values whole", () => {
  assert.deepEqual(tokenizeQuery("c:food n:lunch,from:2026-01-01"), ["c:food", "n:lunch", "from:2026-01-01"]);
  const quoted = parseSearchQuery('note:"coffee, beans"');
  assert.deepEqual(quoted.note, ["coffee, beans"]);
  assert.deepEqual(quoted.tokens.map((token) => token.raw), ['note:"coffee, beans"']);
  const multiword = parseSearchQuery('c:"Food & drink"');
  assert.deepEqual(multiword.category, ["Food & drink"]);
});

test("treats unknown fields and bare words as text", () => {
  const parsed = parseSearchQuery("foo:bar rent");
  assert.deepEqual(parsed.text, ["foo:bar", "rent"]);
  assert.deepEqual(parsed.ignored, []);
});

test("ignores unusable values without throwing", () => {
  assert.deepEqual(parseSearchQuery("from:2026-13-45").ignored, ["from:2026-13-45"]);
  assert.equal(parseSearchQuery("from:2026-13-45").from, null);
  assert.deepEqual(parseSearchQuery("from:2026-02-30").ignored, ["from:2026-02-30"]);
  assert.deepEqual(parseSearchQuery("c:").ignored, ["c:"]);
  assert.deepEqual(parseSearchQuery("amt:abc").ignored, ["amt:abc"]);
  assert.deepEqual(parseSearchQuery("c:*").ignored, ["c:*"]);
  assert.deepEqual(parseSearchQuery("amt:900..100").ignored, ["amt:900..100"]);
});

test("keeps partial input working while typing", () => {
  const parsed = parseSearchQuery("from:2026-0");
  assert.equal(parsed.from, null);
  assert.deepEqual(parsed.ignored, ["from:2026-0"]);
  assert.deepEqual(parseSearchQuery("c:shop, n:").category, ["shop"]);
});

test("parses amount comparisons, ranges and exact values", () => {
  assert.deepEqual(parseSearchQuery("amt:>500").amount, [{ op: ">", value: "500" }]);
  assert.deepEqual(parseSearchQuery("amount:<=99.5").amount, [{ op: "<=", value: "99.5" }]);
  assert.deepEqual(parseSearchQuery("amt:100..500").amount, [{ op: "between", value: "100", upper: "500" }]);
  assert.deepEqual(parseSearchQuery("amt:12").amount, [{ op: "=", value: "12" }]);
  assert.deepEqual(parseSearchQuery("amt:>500,amt:<1000").amount, [{ op: ">", value: "500" }, { op: "<", value: "1000" }]);
});

test("caps runaway queries", () => {
  const notes = Array.from({ length: 8 }, (_, index) => `n:term${index}`).join(",");
  assert.equal(parseSearchQuery(notes).note.length, 6);
  assert.equal(parseSearchQuery(notes).ignored.length, 2);
  assert.equal(parseSearchQuery("a ".repeat(20)).text.length, 8);
});

test("builds LIKE patterns with escaped metacharacters", () => {
  assert.equal(likePattern("shop"), "%shop%");
  assert.equal(likePattern("shop*"), "shop%");
  assert.equal(likePattern("*hop*"), "%hop%");
  assert.equal(likePattern("sh*p"), "sh%p");
  assert.equal(likePattern("50%_off"), "%50\\%\\_off%");
  assert.equal(likePattern("a*b*c"), "a%b%c");
});

test("builds numbered placeholders and bound values", () => {
  const parsed = parseSearchQuery("c:shop*, n:bubu, amt:>500, amt:100..200, from:2026-01-01, to:2026-03-31");
  const built = buildTransactionSearch(parsed, 2);
  assert.deepEqual(built.values, ["shop%", "%bubu%", "500", "100", "200", "2026-01-01", "2026-03-31"]);
  assert.match(built.where, /c\.name ILIKE \$2/);
  assert.match(built.where, /t\.notes ILIKE \$3/);
  assert.match(built.where, /ABS\(t\.amount\) > \$4::numeric/);
  assert.match(built.where, /ABS\(t\.amount\) BETWEEN \$5::numeric AND \$6::numeric/);
  assert.match(built.where, /t\.occurred_at >= \(\$7::date::timestamp AT TIME ZONE 'Asia\/Kolkata'\)/);
  assert.match(built.where, /t\.occurred_at < \(\(\(\$8::date \+ 1\)::timestamp\) AT TIME ZONE 'Asia\/Kolkata'\)/);
  assert.equal(built.relevanceParam, null);
});

test("bare terms stay fuzzy-ranked, wildcard terms stay strict", () => {
  const fuzzy = buildTransactionSearch(parseSearchQuery("bubu"), 2);
  assert.match(fuzzy.where, /t\.notes % \$2 OR c\.name % \$2/);
  assert.equal(fuzzy.relevanceParam, 2);
  const strict = buildTransactionSearch(parseSearchQuery("bubu*"), 2);
  assert.doesNotMatch(strict.where, /%/);
  assert.match(strict.where, /t\.notes ILIKE \$2/);
});

test("never interpolates user text into SQL", () => {
  const built = buildTransactionSearch(parseSearchQuery('n:"\';DROP TABLE tracker_transactions;--"'), 2);
  assert.doesNotMatch(built.where, /DROP|;/);
  assert.deepEqual(built.values, ["%';DROP TABLE tracker\\_transactions;--%"]);
});

test("empty query produces no filter", () => {
  const built = buildTransactionSearch(parseSearchQuery("   "), 2);
  assert.equal(built.where, "");
  assert.deepEqual(built.values, []);
});
