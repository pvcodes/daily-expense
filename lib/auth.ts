import { constantTimeEq, isKnownUser, USER_ID_RE } from "./users";

export const AUTH_COOKIE = "app_auth";
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

function toBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(payload: string): Promise<string> {
  // APP_SECRET is preferred; APP_PASSWORD stays as the fallback so existing
  // deployments keep working without adding another variable.
  const secret = process.env.APP_SECRET || process.env.APP_PASSWORD || "";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return toBase64Url(sig);
}

export async function createAuthToken(userId: string): Promise<string> {
  if (!USER_ID_RE.test(userId)) throw new Error(`Invalid user id: ${userId}`);
  const exp = Date.now() + MAX_AGE_MS;
  const payload = `${userId}.${exp}`;
  const mac = await hmac(payload);
  return `${payload}.${mac}`;
}

/**
 * Returns the signed-in user id, or null when the cookie is missing, tampered
 * with, expired, or names a user that no longer exists in APP_USERS.
 */
export async function verifyAuthToken(
  token: string | undefined | null
): Promise<string | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [id, expStr, mac] = parts;
  const exp = Number(expStr);
  if (!USER_ID_RE.test(id)) return null;
  if (!Number.isFinite(exp) || exp < Date.now()) return null;
  const expected = await hmac(`${id}.${expStr}`);
  if (!constantTimeEq(mac, expected)) return null;
  return isKnownUser(id) ? id : null;
}

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return undefined;
}

/** User id behind a request, or null if unauthenticated. */
export async function sessionUserId(req: Request): Promise<string | null> {
  return verifyAuthToken(readCookie(req, AUTH_COOKIE));
}

// In-memory per-IP limiter for auth attempts. Vercel serverless instances are
// ephemeral, so this is best-effort per instance — it still stops casual
// brute-force without adding infra.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

const attempts = new Map<string, { count: number; resetAt: number }>();

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export function checkRateLimit(ip: string): {
  ok: boolean;
  retryAfterSec: number;
} {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, retryAfterSec: 0 };
  }
  entry.count += 1;
  if (entry.count > MAX_ATTEMPTS) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
    return { ok: false, retryAfterSec };
  }
  return { ok: true, retryAfterSec: 0 };
}

export function clearRateLimit(ip: string) {
  attempts.delete(ip);
}