import "dotenv/config";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}
fs.mkdirSync("backups", { recursive: true });
const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const output = "backups/neon-before-migration-" + stamp + ".dump";
const result = spawnSync("pg_dump", ["--format=custom", "--no-owner", "--file=" + output, databaseUrl], { stdio: "inherit" });
if (result.error) {
  console.error("Could not run pg_dump:", result.error.message);
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status || 1);
console.log("Backup saved to " + output);
