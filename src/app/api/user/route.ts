import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import db from "@/db";
import bcrypt from "bcrypt";

const requestBodySchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
	name: z.string(),
	img_url: z.string().optional(),
});

// export async function GET(req: NextRequest) {
// 	return NextResponse.json({ message: "123" });
// }

export async function POST(req: NextRequest) {
	const payload = requestBodySchema.safeParse(await req.json());
	if (!payload.success) {
		return NextResponse.json(
			{ success: payload.success, error: payload.error },
			{
				status: 422,
			}
		);
	}

	try {
		const user = await db.user.create({
			data: {
				email: payload.data.email as string,
				password: await bcrypt.hash(payload.data.password, 10),
				name: payload.data.name,
				img_url: payload.data.img_url,
			},
			select: {
				email: true,
			},
		});
		return NextResponse.json({
			success: true,
			data: user,
		});
	} catch (error) {
		return NextResponse.json(
			{ success: payload.success, message: "db error", error },
			{
				status: 400,
			}
		);
	}
}
