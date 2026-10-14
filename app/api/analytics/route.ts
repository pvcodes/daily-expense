import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

function validMonth(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + "-01")));
}

export async function GET(request: Request) {
  try {
    await requireSession();
    const url = new URL(request.url);
    const requested = url.searchParams.get("month");
    const month = validMonth(requested) ? requested : new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit"
    }).format(new Date());
    const monthStart = month + "-01";
    const totals = await query(
      "WITH bounds AS (SELECT $1::date AS start_date, ($1::date + INTERVAL '1 month')::date AS next_date), " +
      "current_totals AS (SELECT a.currency::text AS currency, SUM(ABS(a.amount)) AS amount FROM tracker_analysis_transactions a, bounds b " +
        "WHERE a.occurred_at >= (b.start_date::timestamp AT TIME ZONE 'Asia/Kolkata') AND a.occurred_at < (b.next_date::timestamp AT TIME ZONE 'Asia/Kolkata') GROUP BY 1), " +
      "previous_totals AS (SELECT a.currency::text AS currency, SUM(ABS(a.amount)) AS amount FROM tracker_analysis_transactions a, bounds b " +
        "WHERE a.occurred_at >= ((b.start_date - INTERVAL '1 month')::timestamp AT TIME ZONE 'Asia/Kolkata') AND a.occurred_at < (b.start_date::timestamp AT TIME ZONE 'Asia/Kolkata') GROUP BY 1) " +
      "SELECT COALESCE(c.currency, p.currency) AS currency, COALESCE(c.amount,0)::text AS amount, COALESCE(p.amount,0)::text AS previous_amount " +
      "FROM current_totals c FULL JOIN previous_totals p USING (currency) ORDER BY 1",
      [monthStart]
    );
    const months = await query(
      "SELECT to_char(a.occurred_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM') AS month, a.currency::text, SUM(ABS(a.amount))::text AS amount " +
      "FROM tracker_analysis_transactions a WHERE a.occurred_at >= (($1::date - INTERVAL '5 months')::timestamp AT TIME ZONE 'Asia/Kolkata') " +
      "AND a.occurred_at < (($1::date + INTERVAL '1 month')::timestamp AT TIME ZONE 'Asia/Kolkata') " +
      "GROUP BY 1,2 ORDER BY 1,2",
      [monthStart]
    );
    const categories = await query(
      "SELECT a.category_name AS category, a.category_icon AS icon, a.currency::text, SUM(ABS(a.amount))::text AS amount, COUNT(*)::int AS count " +
      "FROM tracker_analysis_transactions a WHERE a.occurred_at >= ($1::date::timestamp AT TIME ZONE 'Asia/Kolkata') " +
      "AND a.occurred_at < (($1::date + INTERVAL '1 month')::timestamp AT TIME ZONE 'Asia/Kolkata') " +
      "GROUP BY 1,2,3 ORDER BY SUM(ABS(a.amount)) DESC",
      [monthStart]
    );
    const weekdays = await query(
      "SELECT to_char(a.occurred_at AT TIME ZONE 'Asia/Kolkata', 'Dy') AS day, a.currency::text, " +
      "AVG(ABS(a.amount))::text AS amount FROM tracker_analysis_transactions a " +
      "WHERE a.occurred_at >= ($1::date::timestamp AT TIME ZONE 'Asia/Kolkata') " +
      "AND a.occurred_at < (($1::date + INTERVAL '1 month')::timestamp AT TIME ZONE 'Asia/Kolkata') " +
      "GROUP BY EXTRACT(ISODOW FROM a.occurred_at AT TIME ZONE 'Asia/Kolkata'), day, a.currency " +
      "ORDER BY EXTRACT(ISODOW FROM a.occurred_at AT TIME ZONE 'Asia/Kolkata'), a.currency",
      [monthStart]
    );
    const daily = await query(
      "SELECT to_char(a.occurred_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS date, a.currency::text, SUM(ABS(a.amount))::text AS amount " +
      "FROM tracker_analysis_transactions a WHERE a.occurred_at >= ($1::date::timestamp AT TIME ZONE 'Asia/Kolkata') " +
      "AND a.occurred_at < (($1::date + INTERVAL '1 month')::timestamp AT TIME ZONE 'Asia/Kolkata') " +
      "GROUP BY 1,2 ORDER BY 1",
      [monthStart]
    );

    return NextResponse.json({
      month,
      totals: totals.rows,
      months: months.rows,
      categories: categories.rows,
      weekdays: weekdays.rows,
      daily: daily.rows
    });
  } catch (error) {
    const status = (error as { status?: number }).status || 500;
    return NextResponse.json({ error: status === 401 ? "Sign in again." : "Could not load insights." }, { status });
  }
}
