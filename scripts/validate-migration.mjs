import "dotenv/config";
import pg from "pg";

const { Pool } = pg;
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, ssl: true });

try {
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM tracker_transactions) AS transactions,
      (SELECT COUNT(*)::int FROM tracker_recurring_rules) AS recurring_rules,
      (SELECT COUNT(*)::int FROM tracker_categories) AS categories,
      (SELECT COUNT(*)::int FROM tracker_transactions WHERE include_in_analysis = FALSE) AS excluded_transactions,
      (SELECT COUNT(*)::int FROM tracker_transactions t LEFT JOIN tracker_categories c ON c.id = t.category_id WHERE c.id IS NULL) AS invalid_categories,
      (SELECT COUNT(*)::int FROM tracker_transactions t LEFT JOIN tracker_recurring_rules r ON r.id = t.recurring_rule_id WHERE t.recurring_rule_id IS NOT NULL AND r.id IS NULL) AS invalid_rules,
      (SELECT COUNT(*)::int FROM tracker_transactions WHERE (recurring_rule_id IS NULL) <> (occurrence_date IS NULL)) AS invalid_occurrence_pairs,
      (SELECT COUNT(*)::int FROM tracker_transactions WHERE id ~ '^r-[A-Za-z0-9]+-[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND (recurring_rule_id IS DISTINCT FROM substring(id from '^r-([A-Za-z0-9]+)-') OR occurrence_date IS DISTINCT FROM substring(id from '([0-9]{4}-[0-9]{2}-[0-9]{2})$')::date) ) AS invalid_legacy_links,
      (SELECT COUNT(*)::int FROM tracker_recurring_rules WHERE cadence <> 'monthly') AS unsupported_cadences,
      (SELECT COUNT(*)::int FROM tracker_transactions WHERE currency NOT IN (SELECT code FROM tracker_currencies)) AS unsupported_transaction_currencies,
      (SELECT COUNT(*)::int FROM tracker_recurring_rules WHERE currency NOT IN (SELECT code FROM tracker_currencies)) AS unsupported_rule_currencies
  `);
  console.log("Tracker integrity:", JSON.stringify(result.rows[0], null, 2));
  const failures = Object.entries(result.rows[0]).filter(([key, value]) =>
    !["transactions", "recurring_rules", "categories", "excluded_transactions"].includes(key) && Number(value) > 0
  );
  if (failures.length > 0) {
    process.exitCode = 2;
    console.error("Tracker integrity validation failed.");
  } else {
    console.log("Tracker constraints and references are valid.");
  }
} finally {
  await pool.end();
}
