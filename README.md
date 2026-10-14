# Pocket Ledger

A single-user, iPhone-first expense tracker using Next.js, Neon Postgres, and Vercel Cron.

## Configure

1. Install Node.js 20 or newer and npm dependencies with npm install.
2. Copy .env.example to .env. Next.js and the migration commands both read this file.
3. Set DATABASE_URL to the Neon pooled connection string. Set TRACKER_PASSWORD to your fixed login password. Generate separate random values for SESSION_SECRET and CRON_SECRET (at least 32 random bytes each).
4. Back up Neon before migrating: npm run db:backup (requires pg_dump; also create a Neon branch/restore point).
5. Run npm run db:migrate, then npm run db:validate. Review row counts, per-currency totals, excluded counts, and category counts before connecting the app to the new tables.
6. Run npm run dev for local use. Add the four environment values to Vercel for deployment. Vercel Hobby invokes the recurring endpoint once per day; due entries keep their scheduled date/time but may appear later.

The cron endpoint is authenticated separately with CRON_SECRET. Never prefix database or session secrets with NEXT_PUBLIC_.

## Data safety

The migrations create tracker-prefixed tables and leave transactions and recurring in place. Monthly legacy rules are scheduled; other legacy cadences stay archived and preserved. If rolling back after the new app has accepted writes, stop new writes first, run db/rollback-to-legacy.sql, compare restored data, then deploy the previous app.

The service worker caches only the app icon and manifest. It does not cache pages, API responses, or transaction data.
