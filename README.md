# retr0 budget

Personal budget tracker for individuals — Arabic-first (RTL) with an English switch, amounts in **USD** and **Syrian pounds (SP)** with an editable exchange rate. Mobile-first UI, admin approval workflow, role-based access.

Live: **https://retr0-budget.pages.dev**

## Stack

- **React 18 + Vite** (SPA)
- **Cloudflare Pages** (hosting + static assets)
- **Pages Functions** (`functions/`) — the JSON API
- **D1** (SQLite) — users, transactions, budgets, audit log
- **Web Crypto** — PBKDF2-SHA256 password hashing, HMAC-signed session cookie

No third-party auth, no ORM, no external database.

## Features

- Sign up / sign in, email + password. New accounts are **pending** until an admin accepts them.
- **Roles:** `admin` (approves accounts, edits/blocks/deletes users, sees the audit log) and `member` (own data only).
- Dashboard: total balance, monthly income/spent/left, budget progress, recent activity.
- Transactions: income/expense, category, note, date, per-entry currency.
- Budgets: monthly limit per category, live progress against the month's spending.
- Settings: name, base currency, **USD↔SP rate** (stored per user, not hard-coded), language.
- Admin: approval queue (accept / deny / delete), user editor (name, email, role, status, currency, rate), audit log.

## Money model

Amounts are stored in the currency they were entered in. Everything shown on the dashboard is converted to the user's **base currency** using their own `sp_rate` (SP per 1 USD). Switching the base currency re-expresses the numbers; it never rewrites stored rows.

## Local development

```bash
npm install
npm run build

# local D1 + functions + static
npx wrangler d1 execute retr0-budget-db --local --file=./schema.sql
npx wrangler pages dev dist --port 8788
```

`.dev.vars` must contain `SESSION_SECRET=...` (see `.dev.vars` in the repo for the local value; production uses a different secret).

### Seed an admin

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASS='...' node tools/seed-admin.mjs
npx wrangler d1 execute retr0-budget-db --local --file=./logs/seed-admin.sql
```

The script hashes the password and writes SQL only — the plaintext is never stored.

## Deploy

```bash
npx wrangler d1 create retr0-budget-db          # copy the database_id into wrangler.toml
npx wrangler d1 execute retr0-budget-db --remote --file=./schema.sql
npx wrangler pages secret put SESSION_SECRET --project-name retr0-budget
npx wrangler pages deploy dist --project-name retr0-budget
```

## API

| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/register` | first account becomes active admin; the rest are `pending` |
| POST | `/api/auth/login` | 403 when pending or blocked |
| POST | `/api/auth/logout` | clears the cookie |
| GET/PATCH | `/api/me` | profile + currency + rate |
| GET | `/api/summary?month=YYYY-MM` | dashboard payload |
| GET/POST | `/api/transactions` | list / create |
| DELETE | `/api/transactions/:id` | own rows, admins any |
| GET/POST | `/api/budgets` | list with spend / upsert by category |
| DELETE | `/api/budgets/:id` | own rows |
| GET | `/api/admin/users` | admin only — users + audit |
| PATCH/DELETE | `/api/admin/users/:id` | accept/deny/block/edit/remove |

## Notes

- The session cookie is `HttpOnly`, `SameSite=Lax`, `Secure`, 30 days, HMAC-SHA256 over `userId.expiry`.
- **Password hashing runs PBKDF2-SHA256 in two 100k rounds** — the Workers runtime rejects `iterations > 100000`, so a single high-iteration call throws and every login silently fails. The stored format is `pbkdf2$2x100000$salt$hash`.
- Admins cannot change their own role/status or delete themselves.
- Deleting a user cascades to their transactions and budgets.
