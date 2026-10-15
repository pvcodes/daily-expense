import { NextResponse } from "next/server";
import { requireSession, validIsoCurrency, validateSameOrigin } from "@/lib/auth";
import { getPool, query } from "@/lib/db";
import { validAmountForCurrency } from "@/lib/format";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireSession();
    const result = await query(
      "SELECT r.id, r.category_id, c.name AS category_name, c.icon AS category_icon, r.amount::text, " +
      "r.currency::text, r.notes, to_char(r.start_date,'YYYY-MM-DD') AS start_date, " +
      "to_char(r.end_date,'YYYY-MM-DD') AS end_date, r.day_of_month, " +
      "r.run_at_local_time::text, to_char(r.next_occurrence_date,'YYYY-MM-DD') AS next_occurrence_date, r.paused, r.archived, r.cadence " +
      "FROM tracker_recurring_rules r JOIN tracker_categories c ON c.id=r.category_id " +
      "ORDER BY r.archived, r.paused, r.next_occurrence_date"
    );
    return NextResponse.json({ rules: result.rows });
  } catch (error) {
    const status = (error as { status?: number }).status || 500;
    return NextResponse.json({ error: status === 401 ? "Sign in again." : "Could not load recurring expenses." }, { status });
  }
}

export async function POST(request: Request) {
  if (!(await validateSameOrigin(request))) return NextResponse.json({ error: "Request origin rejected." }, { status: 403 });
  try {
    await requireSession();
    const body = await request.json();
    if (!validAmountForCurrency(body.amount, body.currency || "INR") || typeof body.category_id !== "string" ||
        !validIsoCurrency(body.currency || "INR") || !/^\d{4}-\d{2}-\d{2}$/.test(body.start_date || "") ||
        !Number.isInteger(Number(body.day_of_month)) || Number(body.day_of_month) < 1 || Number(body.day_of_month) > 31 ||
        !/^\d{2}:\d{2}$/.test(body.run_at_local_time || "") ||
        (body.notes !== undefined && (typeof body.notes !== "string" || body.notes.length > 300)) ||
        (body.end_date && !/^\d{4}-\d{2}-\d{2}$/.test(body.end_date))) {
      return NextResponse.json({ error: "Check amount, category, start date, day, time, and currency." }, { status: 400 });
    }
    const result = await query(
      "INSERT INTO tracker_recurring_rules (id, category_id, amount, currency, notes, cadence, start_date, end_date, " +
      "day_of_month, run_at_local_time, next_occurrence_date) " +
      "VALUES (gen_random_uuid()::text, $1, $2::numeric(18,4), $3, $4, 'monthly', $5::date, $6::date, $7, $8::time, " +
      "tracker_first_month_occurrence($5::date, $7::smallint)) RETURNING id",
      [body.category_id, String(body.amount), body.currency || "INR", body.notes || "", body.start_date, body.end_date || null, Number(body.day_of_month), body.run_at_local_time]
    );
    return NextResponse.json({ id: result.rows[0].id }, { status: 201 });
  } catch (error) {
    const status = (error as { status?: number }).status || 500;
    return NextResponse.json({ error: status === 401 ? "Sign in again." : "Could not save this recurring expense." }, { status });
  }
}
