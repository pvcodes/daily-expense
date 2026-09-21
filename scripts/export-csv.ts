import { writeFileSync } from "fs";
import path from "path";
import { listTransactions } from "../lib/db";
import { exportExpensesCSV } from "../lib/import";

async function main() {
  const args = process.argv.slice(2);
  const toStdout = args.includes("--stdout");
  const outArg = args.find((a) => !a.startsWith("-"));

  const txs = await listTransactions();
  const csv = exportExpensesCSV(txs);

  if (toStdout) {
    process.stdout.write(csv + "\n");
    console.error(`Exported ${txs.length} transactions to stdout.`);
    return;
  }

  const out =
    outArg || path.resolve(process.cwd(), "exported_transactions.csv");
  writeFileSync(out, csv + "\n");
  console.log(`Exported ${txs.length} transactions to ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});