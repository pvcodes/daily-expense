export const AUTH_COOKIE = "app_auth";
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

function toBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(payload: string): Promise<string> {
  const secret = process.env.APP_PASSWORD || "";
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

function constantTimeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createAuthToken(): Promise<string> {
  const exp = Date.now() + MAX_AGE_MS;
  const payload = `me.${exp}`;
  const mac = await hmac(payload);
  return `${payload}.${mac}`;
}

export async function verifyAuthToken(token: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [id, expStr, mac] = parts;
  const exp = Number(expStr);
  if (id !== "me" || !Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = await hmac(`${id}.${expStr}`);
  return constantTimeEq(mac, expected);
}

export function checkPassword(input: string): boolean {
  const expected = process.env.APP_PASSWORD || "";
  if (!expected || input.length !== expected.length) return false;
  return constantTimeEq(input, expected);
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