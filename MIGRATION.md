# Neon data migration

The migration creates new tracker-prefixed tables and leaves the legacy transactions and recurring tables in place.

1. Put the existing Neon pooled connection string in DATABASE_URL.
2. Pause writes from the old app, take a Neon point-in-time/branch backup, and run npm run db:backup where pg_dump is installed.
3. Run npm run db:migrate. Migrations are versioned and recorded in tracker_migrations.
4. Run node scripts/validate-migration.mjs. Do not cut over unless transaction/rule counts, excluded counts, category counts, and totals per currency match.
5. Keep the old app and source tables available during the verification window. Roll back by stopping new writes, running db/rollback-to-legacy.sql, comparing the restored records, and switching deployment to the old app.

Legacy recurrence rules are copied. Monthly rules are activated; other legacy frequencies are preserved as archived rules until their behavior is deliberately supported. The initial scheduler catches up every monthly occurrence from each rule's next eligible occurrence.
