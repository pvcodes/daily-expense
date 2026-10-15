import "dotenv/config";
import pg from "pg";

const { Pool } = pg;
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, ssl: true });

try {
  const presence = await pool.query("SELECT to_regclass('public.transactions') IS NOT NULL AS present");
  if (!presence.rows[0].present) throw new Error("Legacy public.transactions table is missing");

  const result = await pool.query(
    "SELECT " +
    "(SELECT COUNT(*) FROM public.transactions) AS source_transactions, " +
    "(SELECT COUNT(*) FROM tracker_transactions) AS copied_transactions, " +
    "(SELECT COUNT(*) FROM public.recurring) AS source_rules, " +
    "(SELECT COUNT(*) FROM tracker_recurring_rules) AS copied_rules, " +
    "(SELECT COUNT(*) FROM public.transactions WHERE include_in_analysis = FALSE) AS source_excluded, " +
    "(SELECT COUNT(*) FROM tracker_transactions WHERE include_in_analysis = FALSE) AS copied_excluded"
  );
  console.log("Row and exclusion counts:", JSON.stringify(result.rows[0], null, 2));

  const totals = await pool.query(
    "WITH source_totals AS (" +
      "SELECT upper(COALESCE(NULLIF(currency, ''), 'INR')) AS currency, SUM(price::numeric(18,4)) AS amount " +
      "FROM public.transactions GROUP BY 1" +
    "), target_totals AS (" +
      "SELECT currency::text AS currency, SUM(amount) AS amount FROM tracker_transactions GROUP BY 1" +
    ") " +
    "SELECT COALESCE(s.currency, t.currency) AS currency, s.amount AS source_amount, t.amount AS copied_amount, " +
      "COALESCE(s.amount, 0) = COALESCE(t.amount, 0) AS matches " +
    "FROM source_totals s FULL JOIN target_totals t USING (currency) ORDER BY 1"
  );
  console.log("Totals by currency:", JSON.stringify(totals.rows, null, 2));

  const categories = await pool.query(
    "SELECT source.category_key, source.count AS source_count, copied.count AS copied_count " +
    "FROM (SELECT lower(COALESCE(NULLIF(BTRIM(category), ''), 'Other')) AS category_key, COUNT(*) AS count FROM public.transactions GROUP BY 1) source " +
    "FULL JOIN (SELECT lower(c.name) AS category_key, COUNT(*) AS count FROM tracker_transactions t JOIN tracker_categories c ON c.id=t.category_id GROUP BY 1) copied " +
    "USING (category_key) ORDER BY 1"
  );
  console.log("Category counts:", JSON.stringify(categories.rows, null, 2));

  const ruleMismatches = await pool.query(
    "SELECT COUNT(*)::int AS mismatches FROM public.recurring old " +
    "LEFT JOIN tracker_recurring_rules new ON new.id=old.id " +
    "LEFT JOIN tracker_categories category ON category.id=new.category_id " +
    "WHERE new.id IS NULL OR new.amount <> old.price::numeric(18,4) OR new.notes <> COALESCE(old.notes,'') " +
    "OR new.start_date <> old.start_date OR new.last_generated IS DISTINCT FROM old.last_generated " +
    "OR new.paused <> COALESCE(old.paused,FALSE) " +
    "OR lower(category.name) <> lower(COALESCE(NULLIF(BTRIM(old.category),''),'Other')) " +
    "OR new.cadence <> CASE WHEN lower(COALESCE(old.frequency,'monthly')) LIKE '%month%' THEN 'monthly' " +
      "WHEN lower(COALESCE(old.frequency,'monthly')) LIKE '%week%' THEN 'weekly' " +
      "WHEN lower(COALESCE(old.frequency,'monthly')) LIKE '%year%' OR lower(COALESCE(old.frequency,'monthly')) LIKE '%annual%' THEN 'yearly' " +
      "ELSE lower(COALESCE(old.frequency,'monthly')) END " +
    "OR new.run_at_local_time <> CASE WHEN old.time ~ '^[0-2][0-9]:[0-5][0-9](:[0-5][0-9])?$' THEN old.time::time ELSE TIME '00:00' END"
  );
  console.log("Recurring rule field mismatches:", ruleMismatches.rows[0].mismatches);

  const flags = await pool.query(
    "SELECT source.included, source.count AS source_count, copied.count AS copied_count " +
    "FROM (SELECT COALESCE(include_in_analysis,TRUE) AS included, COUNT(*) AS count FROM public.transactions GROUP BY 1) source " +
    "FULL JOIN (SELECT include_in_analysis AS included, COUNT(*) AS count FROM tracker_transactions GROUP BY 1) copied " +
    "USING (included) ORDER BY 1"
  );
  console.log("Analysis flag counts:", JSON.stringify(flags.rows, null, 2));

  const mismatch = totals.rows.some((row) => !row.matches) ||
    categories.rows.some((row) => Number(row.source_count || 0) !== Number(row.copied_count || 0)) ||
    Number(ruleMismatches.rows[0].mismatches) !== 0 ||
    flags.rows.some((row) => Number(row.source_count || 0) !== Number(row.copied_count || 0));
  const counts = result.rows[0];
  if (Number(counts.source_transactions) !== Number(counts.copied_transactions) ||
      Number(counts.source_rules) !== Number(counts.copied_rules) ||
      Number(counts.source_excluded) !== Number(counts.copied_excluded) || mismatch) {
    process.exitCode = 2;
    console.error("Migration validation found a mismatch. Keep the old app and source tables active.");
  } else {
    console.log("Basic migration counts, categories, and totals match.");
  }
} finally {
  await pool.end();
}
