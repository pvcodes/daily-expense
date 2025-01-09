import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(request: NextRequest) {
	const token = await getToken({ req: request });

	// for backend error
	if (
		!request.nextUrl.pathname.startsWith("/api/auth") &&
		request.nextUrl.pathname.startsWith("/api") &&
		!token
	) {
		return Response.json(
			{
				bad: "ok",
			},
			{ status: 400 }
		);
	}

	return NextResponse.next();
}
