# Balancer — Budget Tracker

A personal budget tracker: log income and expenses, set per-category monthly
budgets, and see where your money goes. Amounts are stored in EUR and can be
viewed in EUR / USD / GBP using live exchange rates.

- **Frontend:** React + Vite, React Router, deployed on Vercel
- **Backend:** Express REST API with JWT auth, deployed on Render
- **Database:** PostgreSQL (Neon)

## Features

**Accounts**
- Email + password signup and login (passwords hashed with bcrypt)
- Sessions persist across page refreshes
- All data is private per user

**Dashboard**
- This-month summary cards: total spent, income, net, and budget used
- Spending-by-category donut chart with a percentage legend
- Income-vs-expense trend across the last 6 months
- Budget-vs-actual breakdown per category
- Recent activity feed
- Switchable layout presets (Balanced / Charts / Compact)

**Transactions**
- Add, edit, and delete income or expense entries through a modal
- Full history grouped by month, with per-month spending totals
- Filter by search text, type, category, and date range

**Budgets**
- Set a monthly spending limit per category
- Progress bars with over-budget warnings and remaining/over amounts
- Overall budget-usage summary plus an alert when categories exceed their limit
- Changes save automatically

**Multi-currency**
- View all amounts in EUR, USD, or GBP
- Live exchange rates with an offline fallback; values are stored in EUR and converted on the fly

## Project structure

```
budget_tracker/
├── backend/              # Express API
│   ├── server.js         # app entry — mounts routes
│   ├── db.js             # pg connection pool (Neon, SSL)
│   ├── middleware/auth.js# JWT bearer-token guard
│   ├── routes/           # auth, transactions, budgets
│   └── migrations/       # SQL migrations
├── frontend/             # React + Vite app ("Balancer")
│   ├── src/
│   │   ├── api.js        # single place that talks to the backend
│   │   ├── App.jsx       # top-level state, routing, data loading
│   │   ├── data.js       # constants + formatting/currency helpers
│   │   └── components/   # Dashboard, Transactions, Budgets, AuthScreen, …
│   └── vercel.json       # SPA fallback so client routes survive refresh
└── README.md
```

## Local development

### Prerequisites
- Node.js 18+
- A PostgreSQL database (e.g. a free [Neon](https://neon.tech) project)

### Backend

```bash
cd backend
npm install
# set DATABASE_URL and JWT_SECRET in backend/.env (see Deployment for the variable list)
npm run dev      # nodemon, or `npm start` for plain node
```

### Frontend

```bash
cd frontend
npm install
npm run dev      # Vite dev server on http://localhost:5173
```

By default the frontend calls `http://localhost:3000`. To point it elsewhere,
set `VITE_API_URL` in `frontend/.env`:
```
VITE_API_URL=http://localhost:3000
```

## Database

Three tables: `users`, `transactions`, `budgets` — all rows are scoped to a
`user_id`. Amounts are stored in EUR. `transactions.type` is `income` or
`expense`; `category` is constrained to the app's fixed category set on both
`transactions` and `budgets`.

> **Note:** the repo ships migrations, not a full schema dump.
> `migrations/001_align_categories.sql` aligns the category `CHECK`
> constraints with the frontend's categories. A fresh database must already
> have the `users` / `transactions` / `budgets` tables created before running it.

## API reference

All `/api/transactions` and `/api/budgets` routes require an
`Authorization: Bearer <token>` header (the token comes from signup/login).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/health` | Liveness check |
| POST   | `/api/auth/signup` | Create account → `{ token, user }` |
| POST   | `/api/auth/login`  | Log in → `{ token, user }` |
| GET    | `/api/transactions` | List the user's transactions |
| POST   | `/api/transactions` | Create a transaction |
| PUT    | `/api/transactions/:id` | Update a transaction |
| DELETE | `/api/transactions/:id` | Delete a transaction |
| GET    | `/api/budgets` | Budget limits as `{ category: limit }` |
| PUT    | `/api/budgets` | Set limits: `{ budgets: { category: limit } }` |

Passwords are hashed with bcrypt; auth tokens are JWTs (7-day expiry).

## Deployment

**Backend → Render** (web service):
- Root directory: `backend`
- Build: `npm install` · Start: `npm start`
- Env vars: `DATABASE_URL`, `JWT_SECRET` (Render sets `PORT` automatically)
- Health check path: `/api/health`

**Frontend → Vercel** (static build):
- Root directory: `frontend`
- Build: `npm run build` · Output: `dist`
- Env var: `VITE_API_URL` = your deployed backend URL
- `vercel.json` rewrites all paths to `index.html` so refreshing a route
  (e.g. `/dashboard`) doesn't 404.

After deploying, restrict the backend's CORS to your frontend's origin.
