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

		const [bins, total] = await Promise.all([
			db.bin.findMany({
				where: {
					userId: user.id,
				},
				skip: offset,
				take: limit,
				orderBy: {
					createdAt: "desc",
				},
			}),
			db.bin.count({
				where: {
					userId: user.id,
				},
			}),
		]);

		// Return paginated response
		return Response.json({
			success: true,
			data: {
				bins,
				pagination: {
					page,
					limit,
					total,
					totalPages: Math.ceil(total / limit),
					hasMore: offset + bins.length < total,
				},
			},
		});
	} catch (error) {
		console.error("Budget fetch error:", JSON.stringify(error));

		return NextResponse.json(
			{
				success: false,
				error: "Internal server error",
			},
			{ status: 400 }
		);
	}
}

export async function POST(req: NextRequest) {
	try {
		// Get authenticated session
		const { user } = (await getServerSession(authOptions)) as Session;
		const { name, content, uid, isMarkdown } = await req.json();

		const bin = await db.bin.create({
			data: {
				userId: user.id as number,
				uid,
				name,
				content,
				isMarkdown,
			},
		});

		//

		// return Response.json({ budget, nextDay, dayToFind, user })

		// Return response with expenses
		return Response.json({
			success: true,
			data: { bin },
		});
	} catch (error) {
		// console.error("Expense fetch error:", error as Error);

		return NextResponse.json(
			{
				success: false,
				error: "Something went wrong",
				err: JSON.stringify(error) ?? "",
			},
			{ status: 400 }
		);
	}
}

export async function PUT(req: NextRequest) {
	try {
		// Get authenticated session
		const { user } = (await getServerSession(authOptions)) as Session;
		const { uid, name, content, isMarkdown } = await req.json();

		const bin = await db.bin.update({
			where: { uid, userId: user.id },
			data: {
				name,
				content,
				isMarkdown,
				updatedAt: new Date(), // go not option, prisma auto update not working
			},
		});

		//

		// return Response.json({ budget, nextDay, dayToFind, user })

		// Return response with expenses
		return Response.json({
			success: true,
			data: { bin },
		});
	} catch (error) {
		// console.error("Expense fetch error:", error as Error);

		return NextResponse.json(
			{
				success: false,
				error: "Something went wrong",
				err: JSON.stringify(error) ?? "",
			},
			{ status: 400 }
		);
	}
}

// ... existing code ...

export async function DELETE(req: NextRequest) {
	try {
		// Get authenticated session
		const { user } = (await getServerSession(authOptions)) as Session;
		const uid = req.nextUrl.searchParams.get("uid");

		if (!uid) {
			return NextResponse.json(
				{
					success: false,
					error: "UID is required",
				},
				{ status: 400 }
			);
		}

		const bin = await db.bin.delete({
			where: {
				uid,
				userId: user.id,
			},
		});

		return NextResponse.json({
			success: true,
			data: { bin },
		});
	} catch (error) {
		console.error("Bin delete error:", error);

		return NextResponse.json(
			{
				success: false,
				error: "Internal server error",
			},
			{ status: 400 }
		);
	}
}

// ... existing code ...
