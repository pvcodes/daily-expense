# Pocket Ledger

Personal expense tracker built with Next.js App Router, React, PostgreSQL on Neon, and Vercel. This deployment is single-user and protected by a server-validated password session.

## Runtime and data

- Run with `pnpm dev`; create a production build with `pnpm build`.
- `DATABASE_URL` points to Neon. `TRACKER_PASSWORD`, `SESSION_SECRET`, and `CRON_SECRET` are server-only environment variables. Never expose them to client code or commit `.env` files.
- Active application data is stored in `tracker_*` tables. The original `transactions` and `recurring` tables are preserved as migration sources.
- Versioned SQL migrations live in `db/migrations/`; migration, backup, and validation commands live in `scripts/`. Back up and validate before applying data changes.
- Amounts use PostgreSQL `NUMERIC`, timestamps use `TIMESTAMPTZ`, and recurring schedules use `Asia/Kolkata`.

## Application behavior

- All protected pages and API routes validate the session on the server. Mutations also validate request origin. Keep session cookies HTTP-only, secure in production, and SameSite=Lax.
- Recurring generation is invoked by the daily Vercel cron. Preserve catch-up behavior, the unique `(recurring_rule_id, occurrence_date)` key, and safe retries when changing recurrence code.
- Analytics read from `tracker_analysis_transactions`, which contains included transactions only. Keep totals separated by ISO currency.
- The dashboard is mobile-first and installable as a PWA. Keep entry controls comfortable on iPhone and preserve keyboard, safe-area, and accessible states.

## Deployment

- Vercel is linked through the existing `.vercel` project config. Deployments use the production environment and `vercel.json` cron configuration.
- Never include local transaction exports, backups, credentials, `.vercel`, or generated build output in Git.
