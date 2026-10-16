import { NextResponse } from "next/server";
import { requireSession, validIsoCurrency, validateSameOrigin } from "@/lib/auth";
import { query } from "@/lib/db";
import { validAmountForCurrency } from "@/lib/format";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await validateSameOrigin(request))) return NextResponse.json({ error: "Request origin rejected." }, { status: 403 });
  try {
    await requireSession();
    const { id } = await context.params;
    const body = await request.json();
    const amount = String(body.amount ?? "");
    if (!validAmountForCurrency(amount, body.currency || "INR") ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(body.occurred_at || "") ||
        typeof body.category_id !== "string" || !validIsoCurrency(body.currency || "INR") ||
        typeof body.include_in_analysis !== "boolean" || typeof body.notes !== "string" || body.notes.length > 300) {
      return NextResponse.json({ error: "Check each transaction field and try again." }, { status: 400 });
    }
    const result = await query(
      "UPDATE tracker_transactions SET occurred_at = ($1::timestamp AT TIME ZONE 'Asia/Kolkata'), " +
      "category_id = $2, amount = $3::numeric(18,4), currency = $4, notes = $5, " +
      "include_in_analysis = $6, updated_at = NOW() WHERE id = $7 AND deleted_at IS NULL RETURNING id",
      [body.occurred_at, body.category_id, amount, body.currency || "INR", body.notes, body.include_in_analysis, id]
    );
    if (!result.rowCount) return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = (error as { status?: number }).status || 500;
    return NextResponse.json({ error: status === 401 ? "Sign in again." : "Could not update this transaction." }, { status });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!(await validateSameOrigin(request))) return NextResponse.json({ error: "Request origin rejected." }, { status: 403 });
  try {
    await requireSession();
    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const remark = typeof body?.remark === "string" ? body.remark.trim() : "";
    if (!remark || remark.length > 300) {
      return NextResponse.json({ error: "Add a remark (up to 300 characters) explaining this deletion." }, { status: 400 });
    }
    const result = await query(
      "UPDATE tracker_transactions SET deleted_at = NOW(), delete_remark = $2, updated_at = NOW() " +
      "WHERE id = $1 AND deleted_at IS NULL RETURNING id",
      [id, remark]
    );
    if (!result.rowCount) return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = (error as { status?: number }).status || 500;
    return NextResponse.json({ error: status === 401 ? "Sign in again." : "Could not delete this transaction." }, { status });
  }
}
