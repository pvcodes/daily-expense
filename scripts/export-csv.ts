import { writeFileSync } from "fs";
import path from "path";
import { listTransactions } from "../lib/db";
import { exportExpensesCSV } from "../lib/import";
import { requireUser } from "../lib/users";

async function main() {
  const args = process.argv.slice(2);
  const toStdout = args.includes("--stdout");
  const userIdx = args.indexOf("--user");
  const userId = requireUser(userIdx >= 0 ? args[userIdx + 1] : undefined);
  const outArg = args.find(
    (a, i) => !a.startsWith("-") && i !== userIdx + 1 && args[i - 1] !== "--user"
  );

  const txs = await listTransactions(userId);
  const csv = exportExpensesCSV(txs);

  if (toStdout) {
    process.stdout.write(csv + "\n");
    console.error(`Exported ${txs.length} transactions for '${userId}' to stdout.`);
    return;
  }

  const out =
    outArg || path.resolve(process.cwd(), "exported_transactions.csv");
  writeFileSync(out, csv + "\n");
  console.log(`Exported ${txs.length} transactions for '${userId}' to ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});