import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, verifyAuthToken } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (token && (await verifyAuthToken(token))) return NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon|apple-touch-icon|icons|manifest\\.webmanifest|sw\\.js|login|api/auth).*)",
  ],
};