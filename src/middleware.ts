// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import { getToken } from "next-auth/jwt";

// // Define public routes that don't require authentication
// const PUBLIC_ROUTES = [
// 	"/",
// 	"/api/user",
// 	"/_next",
// 	"/api/auth",
// 	"/favicon.ico",
// ] as const;

// // Helper function to check if a path starts with any of the public routes
// const isPublicRoute = (pathname: string): boolean => {
// 	return PUBLIC_ROUTES.some(
// 		(route) => pathname === route || pathname.startsWith(route)
// 	);
// };

// // Helper function to check if path is an expense route
// const isExpenseRoute = (pathname: string): boolean => {
// 	return pathname.startsWith("/expense/");
// };

// export async function middleware(request: NextRequest) {
// 	const { pathname } = request.nextUrl;
// 	const { method } = request;
// 	const token = await getToken({ req: request });

// 	console.log({ pathname });

// 	if (pathname.startsWith("/expense") && !token) return NextResponse.next();

// 	// Special case for POST /api/user which is always allowed
// 	if (pathname === "/api/user" && method === "POST") {
// 		return NextResponse.next();
// 	}

// 	// Allow access to public routes without authentication
// 	if (isPublicRoute(pathname)) {
// 		return NextResponse.next();
// 	}

// 	// Get authentication token

// 	// Handle expense routes and other protected routes for unauthenticated users
// 	if (!token) {
// 		// Check if it's an expense route
// 		if (isExpenseRoute(pathname)) {
// 			return NextResponse.redirect(
// 				new URL("/api/auth/signin", request.url)
// 			);
// 		}

// 		// Handle API routes
// 		if (pathname.startsWith("/api")) {
// 			return Response.json(
// 				{
// 					success: false,
// 					message: "Unauthorized access",
// 				},
// 				{ status: 401 }
// 			);
// 		}

// 		// Handle other protected routes
// 		return NextResponse.redirect(new URL("/api/auth/signin", request.url));
// 	}

// 	// Special case for GET /api/user which requires authentication
// 	if (pathname === "/api/user" && method !== "POST") {
// 		if (!token) {
// 			return Response.json(
// 				{
// 					success: false,
// 					message: "Unauthorized access",
// 				},
// 				{ status: 401 }
// 			);
// 		}
// 	}

// 	return NextResponse.next();
// }

// // Specify which routes this middleware should run on
// export const config = {
// 	matcher: [
// 		/*
// 		 * Match all request paths except for the ones starting with:
// 		 * - _next/static (static files)
// 		 * - _next/image (image optimization files)
// 		 * - favicon.ico (favicon file)
// 		 */
// 		"/((?!_next/static|_next/image|favicon.ico).*)",
// 	],
// };

export { default } from "next-auth/middleware";

export const config = { matcher: ["/expense/:path*", "/api/((?!user$).*)","/bin/:path*"] };
