import db from "@/db";
import { NextResponse } from "next/server";
export async function GET() {
	const userId = 9;
	const budgets = await db.budget.findMany({
		where: { userId },
		select: { id: true, amount: true },
	});
	for (const { id, amount } of budgets) {
		const expenses = await db.expense.findMany({
			where: { budgetId: id },
			select: { amount: true },
		});
		let totalSpent = 0;
		expenses.forEach((expense) => {
			totalSpent += expense.amount;
		});
		await db.budget.update({
			where: { id },
			data: { remaining: amount - totalSpent },
		});
	}
	return NextResponse.json("ok");
}
