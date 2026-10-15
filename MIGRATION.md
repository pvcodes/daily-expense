# Neon data migration

The versioned migrations reshape the legacy transaction and recurring data into the tracker schema, then remove the duplicate legacy tables. `tracker_transactions` and `tracker_recurring_rules` are the sole application records after migration.

1. Stop writes from any older app version.
2. Set `DATABASE_URL`, take a Neon restore point, and run `pnpm run db:backup` (`pg_dump` must be installed).
3. Run `pnpm run db:migrate`; applied versions are recorded in `tracker_migrations`.
4. Run `pnpm run db:validate` and review the tracker integrity report.

The source tables are removed by migration 006. Restore the pre-migration backup to roll back; the old schema is not kept live alongside the tracker tables.

Recurring rules support monthly cadence. The migration preserves tracker records and their scheduled occurrence links, uses `Asia/Kolkata` for local-time interpretation, and imports post-migration owner transactions before removing the source tables.
