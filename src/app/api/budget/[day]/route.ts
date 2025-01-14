// export fetchSingleBin

import db from "@/db";
import { authOptions } from "@/lib/auth";
import { getServerSession, Session } from "next-auth";
import { NextRequest } from "next/server";

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ day: string }> }
) {
	try {
		const { user } = (await getServerSession(authOptions)) as Session;

		const dayString = (await params).day;
		const startOfDay = new Date(dayString);
		const endOfDay = new Date(startOfDay);
		endOfDay.setDate(endOfDay.getDate() + 1);

		const budget = await db.budget.findFirst({
			where: {
				day: {
					gte: startOfDay,
					lt: endOfDay,
				},
				userId: user.id as number,
			},
		});
		return Response.json({
			success: true,
			data: {
				budget,
			},
		});
	} catch (error) {
		console.error("Budget fetch error:", JSON.stringify(error));

		return Response.json(
			{
				success: false,
				error: "Internal server error",
			},
			{ status: 400 }
		);
	}
}
