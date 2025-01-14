import { authOptions } from "@/lib/auth";
import { getServerSession, Session } from "next-auth";
import { NextRequest } from "next/server";
import db from "@/db";

export async function POST(req: NextRequest) {
	try {
		const { user } = (await getServerSession(authOptions)) as Session;
		const { amount } = await req.json();
		const budget = await db.budget.create({
			data: {
				amount: parseFloat(amount),
				remaining: parseFloat(amount),
				userId: user.id as number, // user will always be defined
			},
		});
		return Response.json({
			success: true,
			data: { budget },
		});
	} catch (error) {
		return Response.json(
			{
				success: false,
				error,
			},
			{ status: 400 }
		);
	}
}
