import { authOptions } from "@/lib/auth";
import { getServerSession, Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import db from "@/db";
// import { z } from "zod";

// Validation schema for query parameters
// const QuerySchema = z.object({
// 	page: z.coerce.number().positive().default(1),
// 	limit: z.coerce.number().min(1).max(100).default(10),
// });

export async function GET(req: NextRequest) {
	try {
		// Get authenticated session
		const { user } = (await getServerSession(authOptions)) as Session;
		const page = parseInt(
			// TODO: validation and all
			req.nextUrl.searchParams.get("page") as string,
			10
		);
		const limit =
			(parseInt(req.nextUrl.searchParams.get("limit") as string), 10);

		const offset = (page - 1) * limit;

		const [budgets, total] = await Promise.all([
			db.budget.findMany({
				where: {
					userId: user.id,
				},
				skip: offset,
				take: limit,
				orderBy: {
					day: "desc",
				},
			}),
			db.budget.count({
				where: {
					userId: user.id,
				},
			}),
		]);

		// Return paginated response
		return Response.json({
			success: true,
			data: {
				budgets,
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
					hasMore: offset + budgets.length < total,
				},
			},
		});
	} catch (error) {
		console.error("Budget fetch error:", error);

		return NextResponse.json(
			{
				success: false,
				error: "Internal server error",
			},
			{ status: 500 }
		);
	}
}
