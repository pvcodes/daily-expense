import { NextResponse } from "next/server";
import { requireSession, validIsoCurrency, validateSameOrigin } from "@/lib/auth";
import { query } from "@/lib/db";
import { validAmountForCurrency } from "@/lib/format";

export const runtime = "nodejs";

const selectTransactions =
  "SELECT t.id, t.occurred_at, t.category_id, c.name AS category_name, c.icon AS category_icon, " +
  "t.amount::text, t.currency::text, t.notes, t.include_in_analysis, t.recurring_rule_id, t.occurrence_date " +
  "FROM tracker_transactions t JOIN tracker_categories c ON c.id = t.category_id ";

export async function GET(request: Request) {
  try {
    await requireSession();
    const url = new URL(request.url);
    const excluded = url.searchParams.get("excluded") === "true";
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const pageSize = Math.min(50, Math.max(1, Number.parseInt(url.searchParams.get("pageSize") || "20", 10) || 20));
    const search = (url.searchParams.get("search") || "").trim().slice(0, 100);
    const offset = (page - 1) * pageSize;
    const values: unknown[] = [!excluded];
    let filter = "WHERE t.include_in_analysis = $1";
    if (search) {
      values.push(search);
      const n = values.length;
      filter += search.length >= 3
        ? ` AND (t.notes ILIKE '%' || $${n} || '%' OR c.name ILIKE '%' || $${n} || '%' OR t.notes % $${n} OR c.name % $${n})`
        : ` AND (t.notes ILIKE '%' || $${n} || '%' OR c.name ILIKE '%' || $${n} || '%')`;
    }
    const count = await query<{ total: string }>(
      "SELECT COUNT(*)::text AS total FROM tracker_transactions t JOIN tracker_categories c ON c.id = t.category_id " + filter,
      values
    );
    const totals = await query<{ included: string; excluded: string }>(
      "SELECT COUNT(*) FILTER (WHERE include_in_analysis = TRUE)::text AS included, " +
      "COUNT(*) FILTER (WHERE include_in_analysis = FALSE)::text AS excluded FROM tracker_transactions"
    );
    values.push(pageSize, offset);
    const fuzzyOrder = search.length >= 3
      ? `CASE WHEN t.notes % $2 OR c.name % $2 THEN GREATEST(similarity(t.notes, $2), similarity(c.name, $2)) ELSE 0 END DESC, `
      : "";
    const result = await query(
      selectTransactions + filter + ` ORDER BY ${fuzzyOrder}t.occurred_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );
    const total = Number(count.rows[0]?.total || 0);
    return NextResponse.json({ transactions: result.rows, page, pageSize, total, pageCount: Math.max(1, Math.ceil(total / pageSize)), includedTotal: Number(totals.rows[0]?.included || 0), excludedTotal: Number(totals.rows[0]?.excluded || 0) });
  } catch (error) {
    const status = (error as { status?: number }).status || 500;
    return NextResponse.json({ error: status === 401 ? "Sign in again." : "Could not load transactions." }, { status });
  }
}

function validDateTime(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value);
}

export async function POST(request: Request) {
  if (!(await validateSameOrigin(request))) return NextResponse.json({ error: "Request origin rejected." }, { status: 403 });
  try {
    await requireSession();
    const body = await request.json();
    if (!validAmountForCurrency(body.amount, body.currency || "INR") || !validDateTime(body.occurred_at) ||
        typeof body.category_id !== "string" || !validIsoCurrency(body.currency || "INR") ||
        (body.notes !== undefined && (typeof body.notes !== "string" || body.notes.length > 300)) ||
        (body.include_in_analysis !== undefined && typeof body.include_in_analysis !== "boolean")) {
      return NextResponse.json({ error: "Check the amount, date, category, currency, and notes." }, { status: 400 });
    }
    const result = await query(
      "INSERT INTO tracker_transactions (id, occurred_at, category_id, amount, currency, notes, include_in_analysis) " +
      "VALUES (gen_random_uuid()::text, ($1::timestamp AT TIME ZONE 'Asia/Kolkata'), $2, $3::numeric(18,4), $4, $5, $6) " +
      "RETURNING id",
      [body.occurred_at, body.category_id, String(body.amount), body.currency || "INR", body.notes || "", body.include_in_analysis !== false]
    );
    return NextResponse.json({ id: result.rows[0].id }, { status: 201 });
  } catch (error) {
    const status = (error as { status?: number }).status || 500;
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json({ error: status === 401 ? "Sign in again." : message.includes("foreign key") ? "Choose a valid category." : "Could not save this expense." }, { status });
  }
}
