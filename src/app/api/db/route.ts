import db from "@/db";
import { authOptions } from "@/lib/auth";
import { Session } from "next-auth";
import { getServerSession } from "next-auth";
export async function DELETE() {
	try {
		const { user } = (await getServerSession(authOptions)) as Session;

		const expense = await db.expense.deleteMany({
			where: { userId: user.id },
		});

		const budget = await db.budget.deleteMany({
			where: { userId: user.id },
		});

		return Response.json({
			success: true,
			data: { budget, expense },
		});
	} catch (error) {
		return Response.json(
			{
				success: true,
				error,
			},
			{ status: 400 }
		);
	}
}
