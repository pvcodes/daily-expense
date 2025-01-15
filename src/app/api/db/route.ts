import { authOptions } from "@/lib/auth";
import { getServerSession, Session } from "next-auth";
import { NextRequest } from "next/server";
import db from "@/db";

export async function GET(request: NextRequest) {
	try {
		const { user } = (await getServerSession(authOptions)) as Session;
		const params = request.nextUrl.searchParams;
		const deletions: Record<string, any> = {};

		// Define a mapping of parameter names to database models
		const models: Record<
			string,
			{
				deleteMany: (args: {
					where: { userId: string };
				}) => Promise<any>;
			}
		> = {
			expense: db.expense,
			bin: db.bin,
			budget: db.budget,
		};

		// Iterate over the models and delete if the corresponding parameter is true
		for (const [key, model] of Object.entries(models)) {
			if (params.get(key) === "true") {
				deletions[key] = await model.deleteMany({
					where: { userId: user.id },
				});
			}
		}

		return Response.json({
			success: true,
			data: deletions,
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
