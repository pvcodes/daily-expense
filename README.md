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
APP_PASSWORD=270601
DATABASE_URL=postgres://...
```

Seed the database (transfer from the canonical `converted_expenses.csv`):

```bash
npm run seed             # upsert, no overwrite
npm run seed:overwrite   # wipe + reload
```

## Scripts

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Dev server                           |
| `npm run build`    | Production build                     |
| `npm run start`    | Serve production build               |
| `npm run lint`     | ESLint                               |
| `npm run test`     | Vitest unit tests (`npm test`: 35)   |
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
  useWeekStart.ts      # week start day setting
  useWeeklyBudget.ts   # budget state
  sync.ts              # fetchRemote/pushRemote/clearRemote (fetchRemote returns .offline)
lib/
  types.ts              # Transaction + categories/colors
  analytics.ts          # month/week/day aggregations (week-start aware)
  import.ts             # CSV/JSON import-export
  format.ts             # INR + date/time formatting
  auth.ts               # HMAC cookie + rate limiting
```

## Data Model

```ts
Transaction = {
  id,                 // string
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
- Security headers on all responses: strict CSP, no-sniff, frame denial, permissions policy
- Keyboard-visible focus rings, zoomable viewport (no `maximumScale` lock), labeled inputs, 40px touch targets, `aria-expanded` on expandable rows

## Deploy

```bash
vercel deploy --prod --yes
```

Production: https://expense-tracker-app-lemon-ten.vercel.app

See the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for more.