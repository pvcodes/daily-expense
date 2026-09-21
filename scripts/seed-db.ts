import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { parseCSV } from "../lib/import";
import type { Transaction } from "../lib/types";
import { initSchema, upsertMany, countTransactions, clearAllTransactions } from "../lib/db";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, "..");

async function main() {
  const args = process.argv.slice(2);
  const overwrite = args.includes("--overwrite");
  const fileArgs = args.filter((a) => !a.startsWith("-"));
  // converted_expenses.csv is the canonical merged file (850 rows in 4-col format).
  // Pass explicit file paths to seed other sources instead.
  const files =
    fileArgs.length > 0
      ? fileArgs.map((f) => (path.isAbsolute(f) ? f : path.join(process.cwd(), f)))
      : [path.join(APP_ROOT, "../converted_expenses.csv")];

  const all: Transaction[] = [];
  for (const f of files) {
    try {
      const text = readFileSync(f, "utf8");
      const res = parseCSV(text, f);
      all.push(...res.transactions);
      console.log(`${path.basename(f)}: ${res.transactions.length} txs, ${res.errors.length} errors`);
      res.errors.forEach((e) => console.log("  ERR:", e));
    } catch (e) {
      console.error(`Skipping ${f}: ${(e as Error).message}`);
    }
  }

  // de-dup by id (same row may appear in multiple files)
  const seen = new Set<string>();
  const unique = all.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });

  console.log(`\nTotal unique: ${unique.length}`);

  await initSchema();
  if (overwrite) {
    const host = process.env.DATABASE_URL || "";
    if (
      host.includes("sweet-cherry") &&
      process.env.ALLOW_PRODUCTION_DESTRUCTIVE !== "1"
    ) {
      console.error(
        "Refusing to clear the production database from a local run.\n" +
          "Set ALLOW_PRODUCTION_DESTRUCTIVE=1 to override, or point DATABASE_URL at a scratch database."
      );
      process.exit(1);
    }
    await clearAllTransactions();
    console.log("Cleared existing rows (--overwrite).");
  }
  await upsertMany(unique);
  const n = await countTransactions();
  console.log(`Seeded. DB now has ${n} transactions.`);

  if (n !== unique.length) {
    console.warn(`Expected ${unique.length} but DB has ${n}.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});