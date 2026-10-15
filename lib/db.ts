import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var expenseTrackerPool: Pool | undefined;
}

export function getPool(): Pool {
  if (!process.env.DATABASE_URL) throw new Error("Database is not configured. Set DATABASE_URL.");
  if (!global.expenseTrackerPool) {
    global.expenseTrackerPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      ssl: true
    });
  }
  return global.expenseTrackerPool;
}

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(text: string, values: unknown[] = []) {
  const result = await getPool().query<T>(text, values);
  return result;
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(name + " is not configured");
  return value;
}
