// export fetchSingleBin

import db from "@/db";
import { NextRequest } from "next/server";

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ uid: string }> }
) {
	try {
		const uid = (await params).uid;
		const bin = await db.bin.findFirstOrThrow({
			where: {
				uid,
			},
		});
		return Response.json({
			success: true,
			data: {
				bin,
			},
		});
	} catch (error) {
		console.error("Bin fetch error:", error);

		return Response.json(
			{
				success: false,
				error: "Internal server error",
			},
			{ status: 400 }
		);
	}
}
