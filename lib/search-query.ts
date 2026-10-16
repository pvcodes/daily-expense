export type AmountFilter = {
  op: ">" | ">=" | "<" | "<=" | "=" | "between";
  value: string;
  upper?: string;
};

export type SearchTokenKind = "text" | "category" | "note" | "from" | "to" | "amount" | "ignored";

export type SearchToken = {
  raw: string;
  kind: SearchTokenKind;
  value: string;
  amount?: AmountFilter;
};

export type ParsedSearchQuery = {
  tokens: SearchToken[];
  text: string[];
  category: string[];
  note: string[];
  amount: AmountFilter[];
  from: string | null;
  to: string | null;
  ignored: string[];
};

export type TransactionSearchSql = {
  where: string;
  values: unknown[];
  relevanceParam: number | null;
};

const FIELD_ALIASES: Record<string, SearchTokenKind> = {
  c: "category", category: "category",
  n: "note", note: "note",
  from: "from", to: "to",
  amt: "amount", amount: "amount"
};

const MAX_QUERY_LENGTH = 200;
const MAX_TEXT_TERMS = 8;
const MAX_VALUES_PER_FIELD = 6;
const MAX_FILTERS = 12;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const AMOUNT_PATTERN = /^\d{1,12}(?:\.\d{1,4})?$/;

/** Split a raw query into tokens on commas and whitespace, keeping quoted runs together. */
export function tokenizeQuery(raw: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quoted = false;
  for (const character of raw.slice(0, MAX_QUERY_LENGTH)) {
    if (character === "\"") { quoted = !quoted; current += character; continue; }
    if (!quoted && (character === "," || /\s/.test(character))) {
      if (current) tokens.push(current);
      current = "";
      continue;
    }
    current += character;
  }
  if (current) tokens.push(current);
  return tokens;
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed.startsWith("\"") && trimmed.endsWith("\"")) return trimmed.slice(1, -1).trim();
  return trimmed;
}

function isCalendarDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const parsed = new Date(value + "T00:00:00Z");
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function parseAmountFilter(value: string): AmountFilter | null {
  const text = value.replace(/[\s,]/g, "");
  const range = text.match(/^(\d{1,12}(?:\.\d{1,4})?)\.\.(\d{1,12}(?:\.\d{1,4})?)$/);
  if (range) return Number(range[1]) <= Number(range[2]) ? { op: "between", value: range[1], upper: range[2] } : null;
  const comparison = text.match(/^(>=|<=|>|<)?(\d{1,12}(?:\.\d{1,4})?)$/);
  if (!comparison || !AMOUNT_PATTERN.test(comparison[2])) return null;
  return { op: (comparison[1] as AmountFilter["op"]) || "=", value: comparison[2] };
}

/**
 * Parse `field:value` filters mixed with bare text terms. Parsing never throws:
 * an unusable value is reported in `ignored` so the caller can explain it and
 * keep the rest of the query working while the user is still typing.
 */
export function parseSearchQuery(raw: string): ParsedSearchQuery {
  const result: ParsedSearchQuery = { tokens: [], text: [], category: [], note: [], amount: [], from: null, to: null, ignored: [] };
  const counts = new Map<SearchTokenKind, number>();
  const record = (kind: SearchTokenKind) => counts.set(kind, (counts.get(kind) || 0) + 1);
  const filterCount = () => result.category.length + result.note.length + result.amount.length + (result.from ? 1 : 0) + (result.to ? 1 : 0);
  const overloaded = (kind: SearchTokenKind) => (counts.get(kind) || 0) > MAX_VALUES_PER_FIELD || filterCount() > MAX_FILTERS;
  const keep = (token: SearchToken) => result.tokens.push(token);
  const drop = (rawToken: string) => { result.ignored.push(rawToken); keep({ raw: rawToken, kind: "ignored", value: "" }); };

  for (const rawToken of tokenizeQuery(raw)) {
    const match = rawToken.match(/^([A-Za-z]+):(.*)$/);
    const kind = match ? FIELD_ALIASES[match[1].toLowerCase()] : undefined;
    if (!match || !kind) {
      if (result.text.length >= MAX_TEXT_TERMS) continue;
      result.text.push(rawToken);
      keep({ raw: rawToken, kind: "text", value: rawToken });
      continue;
    }
    const value = unquote(match[2]);
    if (!value || /^\*+$/.test(value)) { drop(rawToken); continue; }
    if (kind === "from" || kind === "to") {
      record(kind);
      if (!isCalendarDate(value) || overloaded(kind)) { drop(rawToken); continue; }
      result[kind] = value;
      keep({ raw: rawToken, kind, value });
      continue;
    }
    if (kind === "amount") {
      const amount = parseAmountFilter(value);
      record(kind);
      if (!amount || overloaded(kind)) { drop(rawToken); continue; }
      result.amount.push(amount);
      keep({ raw: rawToken, kind, value, amount });
      continue;
    }
    record(kind);
    if (overloaded(kind)) { drop(rawToken); continue; }
    result[kind].push(value);
    keep({ raw: rawToken, kind, value });
  }
  return result;
}

/** Turn a stored exact value into a LIKE pattern: `*` is the only wildcard, everything else is escaped. */
export function likePattern(value: string): string {
  const escape = (part: string) => part.replace(/[\\%_]/g, (character) => "\\" + character);
  if (!value.includes("*")) return "%" + escape(value) + "%";
  return value.replace(/\*+/g, "*").split("*").map(escape).join("%");
}

/**
 * Build the WHERE fragment and bind values for a parsed query. Field names come from
 * a fixed alias map and every value is bound, so no user text reaches the SQL string.
 * Values start at `startIndex` so the caller can prepend its own parameters.
 */
export function buildTransactionSearch(parsed: ParsedSearchQuery, startIndex: number): TransactionSearchSql {
  const clauses: string[] = [];
  const values: unknown[] = [];
  let index = startIndex;
  let relevanceParam: number | null = null;

  for (const term of parsed.text) {
    const placeholder = "$" + index;
    values.push(likePattern(term));
    index += 1;
    const fuzzy = !term.includes("*") && term.replace(/[^A-Za-z0-9]/g, "").length >= 3
      ? ` OR t.notes % ${placeholder} OR c.name % ${placeholder}`
      : "";
    clauses.push(`(t.notes ILIKE ${placeholder} OR c.name ILIKE ${placeholder}${fuzzy})`);
    if (relevanceParam === null) relevanceParam = Number(placeholder.slice(1));
  }
  for (const value of parsed.category) {
    values.push(likePattern(value));
    clauses.push(`c.name ILIKE $${index}`);
    index += 1;
  }
  for (const value of parsed.note) {
    values.push(likePattern(value));
    clauses.push(`t.notes ILIKE $${index}`);
    index += 1;
  }
  for (const filter of parsed.amount) {
    if (filter.op === "between") {
      values.push(filter.value, filter.upper);
      clauses.push(`ABS(t.amount) BETWEEN $${index}::numeric AND $${index + 1}::numeric`);
      index += 2;
    } else {
      values.push(filter.value);
      clauses.push(`ABS(t.amount) ${filter.op} $${index}::numeric`);
      index += 1;
    }
  }
  if (parsed.from) {
    values.push(parsed.from);
    clauses.push(`t.occurred_at >= ($${index}::date::timestamp AT TIME ZONE 'Asia/Kolkata')`);
    index += 1;
  }
  if (parsed.to) {
    values.push(parsed.to);
    clauses.push(`t.occurred_at < ((($${index}::date + 1)::timestamp) AT TIME ZONE 'Asia/Kolkata')`);
    index += 1;
  }
  return { where: clauses.join(" AND "), values, relevanceParam };
}
