import { NextResponse } from "next/server";
import { requireSession, validIsoCurrency, validateSameOrigin } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { validAmountForCurrency } from "@/lib/format";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await validateSameOrigin(request))) return NextResponse.json({ error: "Request origin rejected." }, { status: 403 });
  const client = await getPool().connect();
  try {
    await requireSession();
    const { id } = await context.params;
    const body = await request.json();
    const updates = body.updates || body;
    if (updates.paused !== undefined && typeof updates.paused !== "boolean" ||
        updates.archived !== undefined && typeof updates.archived !== "boolean") {
      return NextResponse.json({ error: "Invalid rule state." }, { status: 400 });
    }
    if (updates.amount !== undefined &&
        !validAmountForCurrency(updates.amount, updates.currency || "INR")) {
      return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });
    }
    if (updates.currency !== undefined && !validIsoCurrency(updates.currency)) {
      return NextResponse.json({ error: "Choose a valid ISO currency code." }, { status: 400 });
    }
    if (updates.day_of_month !== undefined &&
        (!Number.isInteger(Number(updates.day_of_month)) || Number(updates.day_of_month) < 1 || Number(updates.day_of_month) > 31)) {
      return NextResponse.json({ error: "Choose a day from 1 to 31." }, { status: 400 });
    }

    await client.query("BEGIN");
    const current = await client.query(
      "SELECT *, to_char(start_date,'YYYY-MM-DD') AS start_date_local, to_char(end_date,'YYYY-MM-DD') AS end_date_local " +
      "FROM tracker_recurring_rules WHERE id = $1 FOR UPDATE",
      [id]
    );
    if (!current.rowCount) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Recurring expense not found." }, { status: 404 });
    }

    // Materialize old-rule occurrences already due before changing future settings.
    await client.query("SELECT tracker_process_due_rule($1, NOW())", [id]);
    const r = current.rows[0];
    const stateOnly = Object.keys(updates).length > 0 && Object.keys(updates).every((key) => key === "paused" || key === "archived");
    if (stateOnly) {
      await client.query("UPDATE tracker_recurring_rules SET paused=COALESCE($1,paused), archived=COALESCE($2,archived), updated_at=NOW() WHERE id=$3",
        [updates.paused ?? null, updates.archived ?? null, id]);
      await client.query("COMMIT");
      return NextResponse.json({ ok: true });
    }
    const amount = updates.amount ?? r.amount;
    const categoryId = updates.category_id ?? r.category_id;
    const currency = updates.currency ?? r.currency;
    const notes = updates.notes ?? r.notes ?? "";
    const startDate = updates.start_date ?? r.start_date_local;
    const endDate = updates.end_date === undefined ? r.end_date_local : updates.end_date;
    const day = Number(updates.day_of_month ?? r.day_of_month);
    const runAt = updates.run_at_local_time ?? r.run_at_local_time;
    if (!validAmountForCurrency(amount, currency) ||
        !validIsoCurrency(currency) || typeof notes !== "string" || notes.length > 300 ||
        !/^\d{4}-\d{2}-\d{2}$/.test(String(startDate).slice(0, 10)) ||
        (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(String(endDate).slice(0, 10))) ||
        !/^\d{2}:\d{2}(:\d{2})?$/.test(String(runAt))) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Check the recurring rule fields." }, { status: 400 });
    }

    await client.query(
      "UPDATE tracker_recurring_rules SET category_id=$1, amount=$2::numeric(18,4), currency=$3, notes=$4, " +
      "start_date=$5::date, end_date=$6::date, day_of_month=$7, run_at_local_time=$8::time, " +
      "paused=COALESCE($9,paused), archived=COALESCE($10,archived), " +
      "next_occurrence_date=CASE WHEN $11::boolean THEN " +
      "CASE WHEN tracker_first_month_occurrence($5::date,$7::smallint) < (NOW() AT TIME ZONE 'Asia/Kolkata')::date OR " +
      "(tracker_first_month_occurrence($5::date,$7::smallint) = (NOW() AT TIME ZONE 'Asia/Kolkata')::date AND $8::time <= (NOW() AT TIME ZONE 'Asia/Kolkata')::time) " +
      "THEN tracker_month_occurrence(((NOW() AT TIME ZONE 'Asia/Kolkata')::date + INTERVAL '1 month')::date,$7::smallint) " +
      "ELSE tracker_first_month_occurrence($5::date,$7::smallint) END ELSE next_occurrence_date END, updated_at=NOW() WHERE id=$12",
      [categoryId, String(amount), currency, notes, String(startDate).slice(0, 10), endDate ? String(endDate).slice(0, 10) : null,
        day, String(runAt), updates.paused ?? null, updates.archived ?? null,
        updates.amount !== undefined || updates.category_id !== undefined || updates.currency !== undefined ||
          updates.notes !== undefined || updates.start_date !== undefined || updates.end_date !== undefined ||
        updates.day_of_month !== undefined || updates.run_at_local_time !== undefined ||
        updates.paused !== undefined || updates.archived !== undefined, id]
    );
    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch {}
    const status = (error as { status?: number }).status || 500;
    return NextResponse.json({ error: status === 401 ? "Sign in again." : "Could not update this recurring expense." }, { status });
  } finally {
    client.release();
  }
}
