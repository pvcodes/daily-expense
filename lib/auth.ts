import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { query } from "@/lib/db";

const COOKIE = "pocket_ledger_session";
const SESSION_DAYS = 30;

function secret() {
  return process.env.SESSION_SECRET || "";
}

function tokenHash(token: string) {
  return createHmac("sha256", secret()).update(token).digest("hex");
}

export async function getSession() {
  if (!secret() || !process.env.DATABASE_URL) return null;
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const hash = tokenHash(token);
  const result = await query<{ token_hash: string }>(
    "SELECT token_hash FROM tracker_sessions WHERE token_hash = $1 AND expires_at > NOW()",
    [hash]
  );
  return result.rowCount ? { authenticated: true as const } : null;
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    const error = new Error("Authentication required");
    Object.assign(error, { status: 401 });
    throw error;
  }
  return session;
}

export async function createSession() {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await query("DELETE FROM tracker_sessions WHERE expires_at <= NOW()");
  await query(
    "INSERT INTO tracker_sessions(token_hash, expires_at) VALUES ($1, $2)",
    [tokenHash(token), expiresAt]
  );
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token && secret()) {
    await query("DELETE FROM tracker_sessions WHERE token_hash = $1", [tokenHash(token)]);
  }
  jar.set(COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0)
  });
}

export function passwordMatches(candidate: string) {
  const expected = process.env.TRACKER_PASSWORD || "";
  if (!expected || !candidate) return false;
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function loginKey() {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || headerList.get("x-real-ip") || "unknown";
  return createHmac("sha256", secret()).update("login:" + address).digest("hex");
}

export async function verifyCronSecret(request: Request) {
  const expected = process.env.CRON_SECRET || "";
  const candidate = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!expected || !candidate) return false;
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function validIsoCurrency(value: string) {
  if (!/^[A-Z]{3}$/.test(value)) return false;
  try {
    const supportedValues = Intl.supportedValuesOf?.("currency");
    return supportedValues ? supportedValues.includes(value) : (new Intl.NumberFormat("en", { style: "currency", currency: value }), true);
  } catch {
    return false;
  }
}

export async function validateSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    return false;
  }
  if (parsedOrigin.protocol !== "http:" && parsedOrigin.protocol !== "https:") return false;

  // In development, Next.js may construct request.url using its internal host
  // while the browser connects through the machine's LAN address. Validate
  // against the incoming Host header so same-origin requests work in that case.
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()
    || request.headers.get("host");
  if (!host || parsedOrigin.host.toLowerCase() !== host.toLowerCase()) return false;

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProto ? `${forwardedProto}:` : new URL(request.url).protocol;
  return parsedOrigin.protocol === protocol;
}
