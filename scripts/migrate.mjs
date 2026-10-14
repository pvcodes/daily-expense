import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required. Use the Neon pooled connection string.");
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl, max: 1, ssl: true });
const directory = path.resolve("db/migrations");

try {
  const files = fs.readdirSync(directory).filter((name) => name.endsWith(".sql")).sort();
  for (const file of files) {
    const version = file.replace(/\.sql$/, "");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("CREATE TABLE IF NOT EXISTS tracker_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
      const existing = await client.query("SELECT 1 FROM tracker_migrations WHERE version = $1", [version]);
      if (existing.rowCount) {
        await client.query("ROLLBACK");
        console.log("Already applied: " + version);
        continue;
      }
      await client.query(fs.readFileSync(path.join(directory, file), "utf8"));
      await client.query("INSERT INTO tracker_migrations(version) VALUES ($1)", [version]);
      await client.query("COMMIT");
      console.log("Applied: " + version);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
