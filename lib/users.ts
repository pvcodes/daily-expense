/**
 * Multi-user registry, sourced from the environment (never from the DB, so
 * passcodes are not stored alongside the data they protect).
 *
 * APP_USERS is a comma-separated list of `id:passcode` pairs:
 *
 *   APP_USERS="me:<your passcode>,bubu:bubu27"
 *
 * The id is an opaque label used only to scope rows (it never leaves the
 * server — clients are identified by their signed cookie). Passcodes may
 * contain `:` but not `,`.
 *
 * For backwards compatibility, when APP_USERS is missing/empty the single-user
 * APP_PASSWORD is used and maps to the id `me`.
 */

export const DEFAULT_USER_ID = "me";

export const USER_ID_RE = /^[a-z0-9_-]{1,32}$/;

export interface AppUser {
  id: string;
  passcode: string;
}

export function listUsers(): AppUser[] {
  const raw = process.env.APP_USERS?.trim();
  const users: AppUser[] = [];
  const seen = new Set<string>();

  if (raw) {
    for (const pair of raw.split(",")) {
      const entry = pair.trim();
      const sep = entry.indexOf(":");
      if (sep < 1) continue;
      const id = entry.slice(0, sep).trim().toLowerCase();
      const passcode = entry.slice(sep + 1);
      if (!USER_ID_RE.test(id) || !passcode || seen.has(id)) continue;
      seen.add(id);
      users.push({ id, passcode });
    }
  }

  if (users.length === 0) {
    const legacy = process.env.APP_PASSWORD || "";
    if (legacy) users.push({ id: DEFAULT_USER_ID, passcode: legacy });
  }

  return users;
}

export function isKnownUser(id: string): boolean {
  return listUsers().some((u) => u.id === id);
}

/** Validates a user id for CLI scripts; throws with a hint when it is unknown. */
export function requireUser(id?: string): string {
  const target = (id || "").trim().toLowerCase() || DEFAULT_USER_ID;
  if (!isKnownUser(target)) {
    throw new Error(
      `Unknown user "${target}". Add them to APP_USERS, e.g. APP_USERS="${DEFAULT_USER_ID}:<passcode>,bubu:bubu27".`
    );
  }
  return target;
}

/**
 * Resolves a passcode to its owner. Every configured passcode is compared so
 * the response time does not reveal how many/which entries were skipped.
 */
export function authenticate(input: string): AppUser | null {
  if (!input) return null;
  let match: AppUser | null = null;
  for (const user of listUsers()) {
    if (constantTimeEq(input, user.passcode) && !match) match = user;
  }
  return match;
}

export function constantTimeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}