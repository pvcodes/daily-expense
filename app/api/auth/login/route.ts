import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  checkPassword,
  createAuthToken,
  clientIp,
  checkRateLimit,
  clearRateLimit,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const limit = checkRateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  let password = "";
  try {
    const body = await req.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    // invalid body → fail auth below
  }

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "Wrong passcode" }, { status: 401 });
  }

  clearRateLimit(ip);
  const token = await createAuthToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 90 * 24 * 60 * 60,
  });
  return res;
}