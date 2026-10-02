# Expense Tracker

A privacy-first, mobile-first expense tracker PWA. Built with **Next.js App Router**, **React 19**, **Tailwind CSS v4**, and **Recharts**.

Data lives in **Neon Postgres** (cloud-first) and syncs across devices. Only UI preferences (theme, accent, weekly budget, widgets) stay in local storage; a service worker caches the last synced data so the app works offline as an installable PWA.

![Stack](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8) ![SQLite_icons](https://img.shields.io/badge/DB-Neon%20Postgres-00e4bc)

## Features

- Quick-add transactions (amount, date, time, category, notes) with a category-first workflow
- Dashboard: monthly hero vs. previous month, spend trend chart (Week/Month/Quarter/Year/All), top categories, last-5 recent
- Transactions list with category filter + note search
- Categories → notes drill-down
- Weekly budget that respects your **week start day** (Mon or Sun, configurable in Settings)
- Import/export CSV + JSON, clear-all (with configurable accent themes)
- Installable PWA (manifest + hand-rolled service worker, offline-first SWR caching)
- Passcode-protected API (rate-limited) that mirrors local data to Neon Postgres

## Stack

- **Framework**: Next.js 16 (App Router, Server Components/RSC where possible)
- **UI**: React 19, Tailwind CSS v4, CSS custom properties theming
- **Charts**: Recharts (lazy-loaded via `next/dynamic` to keep initial JS lean)
- **Data**: localStorage (`expense-tracker.v1`) + Neon Postgres (`@neondatabase/serverless`) sync
- **Testing**: Vitest (unit tests for analytics/import/format)

## Getting Started

> **Danger**: `.env` contains the **production** `DATABASE_URL`. Local servers and
> destructive scripts use it too. Never run `npm run seed -- --overwrite` or local
> smoke tests that `DELETE` against it. `seed --overwrite` refuses to clear the prod
> host unless `ALLOW_PRODUCTION_DESTRUCTIVE=1` is set. Prefer a scratch Neon DB for
> local work; export from prod with `curl /api/transactions` first if you need data.

```bash
npm install
npm run dev       # http://localhost:3000
```

Production build + serve:

```bash
npm run build
npm run start
```

Optional cloud sync requires `.env`:

```
APP_USERS="me:270601,bubu:bubu27"
APP_SECRET=<random string>          # signs the session cookie (falls back to APP_PASSWORD)
DATABASE_URL=postgres://...
```

`APP_USERS` is a comma-separated `id:passcode` list — one account per person.
Login is passcode-only: the passcode identifies the account, and every row in
`transactions` / `user_prefs` carries that `user_id`, so nobody sees or
overwrites anybody else's data. `APP_PASSWORD` alone still works and maps to
the single account `me`. Add a person by appending `,<id>:<passcode>` and
redeploying. Passcodes may contain `:` but not `,`.

Seed the database (transfer from the canonical `converted_expenses.csv`):

```bash
npm run seed             # upsert, no overwrite
npm run seed:overwrite   # wipe + reload
npm run seed -- --user bubu file.csv   # seed a specific account
```

## Scripts

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Dev server                           |
| `npm run build`    | Production build                     |
| `npm run start`    | Serve production build               |
| `npm run lint`     | ESLint                               |
| `npm run test`     | Vitest unit tests (`npm test`)       |
| `npm run seed`     | Upsert data from CSV into Postgres   |

## Project Structure

```
app/
  layout.tsx            # root layout: PWA meta, ExpenseProvider, bottom nav
  page.tsx              # dashboard (hero, spend trend, categories, recent)
  transactions/         # filtered transaction list with search
  categories/           # categories -> notes drill-down
  settings/             # import/export, accent theme, week start, budget
  manifest.ts           # PWA manifest (static route)
  api/                  # password auth + transactions sync (Neon Postgres)
components/
  MonthSummary.tsx     # home hero: month spent, delta, today, income/net, sync pill
  WeeklyBudget.tsx     # slim budget vs. week-start-aware spending progress
  SpendingTrend.tsx    # lazy Recharts area chart (Day/Week/Month/...)
  Charts.tsx           # ranked category bars
  AddExpense.tsx       # FAB + bottom-sheet quick-add
  CloudSync.tsx        # refresh / clear-all card for the API
  OfflineBanner.tsx    # amber banner when cached data is showing
  ui.tsx               # shared Section / Skeleton / EmptyState primitives
hooks/
  useExpenses.tsx      # cloud-first context: fetches /api/transactions, optimistic mutations
  useNetworkStatus.ts  # navigator.onLine + listeners
  useSessionUser.ts    # who the auth cookie belongs to
  useWeekStart.ts      # week start day setting
  useWeeklyBudget.ts   # budget state
  sync.ts              # fetchRemote/pushRemote/clearRemote (fetchRemote returns .offline)
lib/
  types.ts              # Transaction + default categories/colors
  analytics.ts          # month/week/day aggregations (week-start aware)
  import.ts             # CSV/JSON import-export
  format.ts             # INR + date/time formatting
  users.ts              # APP_USERS parsing + passcode -> user lookup
  auth.ts               # HMAC cookie (carries user id) + rate limiting
  db.ts                 # Neon Postgres, every query scoped by user_id
  storage.ts            # localStorage + Cache Storage purging
```

## Categories

Five defaults — **Eat Out, Bills, Transport, Groceries, Shopping** — chosen because they cover the buckets that dominate personal spending. Add your own from the add/edit sheet ("+ New"), the Categories page ("+ Category"), or the CLI (type any name). Your list is stored per user and follows you across devices; categories already in your ledger are adopted as yours automatically.

## Data Model

Every row is owned by a user: `transactions` and `user_prefs` are keyed on
`(user_id, id)` / `(user_id, key)`, so transaction ids and preference keys are
only unique within one person's ledger.

```ts
Transaction = {
  id,                 // string, unique per user
  date,               // "yyyy-MM-dd"
  time,               // "HH:mm[:ss]"
  category,           // string
  price,              // negative = expense, positive = income
  currency,           // string (display defaults to INR)
  notes,              // string
}
```

## CSV Format (4 columns)

```
Date,Category,Price,Notes
2024-03-31,Groceries,-1000.0,Weekly shopping
```

The importer also accepts the legacy 17-column format. Dates can be `yyyy-MM-dd`, `yyyy-MM-dd HH:mm[:ss]`, or `mm/dd/yyyy HH:mm`. `"-12,34"` is parsed as −12.34 (comma as decimal separator).

## Security & Accessiblity

- Passcode login is rate-limited (8 attempts / 15 min per IP)
- Accounts come from `APP_USERS`; passcodes are never stored in the DB
- The signed cookie carries the user id, and every transaction/pref query filters on it
- Logging in or out purges Cache Storage + local prefs, so a shared device can't leak the previous user's data offline
- Security headers on all responses: strict CSP, no-sniff, frame denial, permissions policy
- Keyboard-visible focus rings, zoomable viewport (no `maximumScale` lock), labeled inputs, 40px touch targets, `aria-expanded` on expandable rows

## Deploy

```bash
vercel deploy --prod --yes
```

Production: https://expense-tracker-app-lemon-ten.vercel.app

See the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for more.