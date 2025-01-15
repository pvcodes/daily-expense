export { default } from "next-auth/middleware";

export const config = {
	matcher: [
		"/expense/:path*",
		"/api/((?!user$|bin/).*)",
		"/bin/",
		"/dashboard",
	],
};
