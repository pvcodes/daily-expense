import { NextRequest, NextResponse } from "next/server";
import db from "@/db";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ "mm-yy": string }> }
) {
	const mid = (await params)?.["mm-yy"];
	//  TOOD: validation
	const monthlyExpenses = await db.monthlyExpense.findMany({
		where: { mid },
	});

	const totalSpend = monthlyExpenses.reduce(
		(acc, expense) => acc + expense.amount,
		0
	);

	return Response.json({
		success: true,
		data: {
			monthlyExpenses,
			totalSpend,
		},
	});
}

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ "mm-yyyy": string }> }
) {
	try {
		const { user } = (await getServerSession(authOptions)) as Session;

		const mid = (await params)?.["mm-yyyy"];
		console.log({ mid });

		// return Response.json({ mid });

		const { amount, description } = await req.json();
		console.log({ amount, description });

		const expense = await db.monthlyExpense.create({
			data: {
				mid,
				userId: user.id as number,
				amount,
				description,
			},
		});

		return Response.json({
			success: true,
			data: {
				expense,
			},
		});
	} catch (error) {
		console.log(error);
		return NextResponse.json(
			{
				success: false,
				error: "Internal server error",
			},
			{ status: 400 }
		);
	}
}
