/* ============================================================
   data.js — the app's single source of static data + helpers
   ------------------------------------------------------------
   Nothing here talks to a server. The whole app runs on this
   in-memory seed data. Components import what they need from here.
   ============================================================ */

/* Every category the app knows about.
   `c` = the colour used for that category in charts/dots.
   `k` = the "kind": is this an expense category or an income one? */
export const CATS = {
  Groceries:     { c: '#1f9e6f', k: 'expense' },
  Housing:       { c: '#2f5fd0', k: 'expense' },
  Transport:     { c: '#e0852b', k: 'expense' },
  Dining:        { c: '#d6453f', k: 'expense' },
  Entertainment: { c: '#8b46c4', k: 'expense' },
  Utilities:     { c: '#1aa0a8', k: 'expense' },
  Shopping:      { c: '#c43f8b', k: 'expense' },
  Health:        { c: '#4f9e2f', k: 'expense' },
  Other:         { c: '#7a8190', k: 'expense' },
  Salary:        { c: '#1f9e6f', k: 'income' },
  Freelance:     { c: '#2f9e6f', k: 'income' },
  'Other Income':{ c: '#3fae7f', k: 'income' },
}

/* Pre-computed lists of just the expense / income category names.
   We build these once here (CATS never changes while the app runs)
   so components can use them directly instead of filtering every render. */
export const EXPENSE_CATS = Object.keys(CATS).filter((k) => CATS[k].k === 'expense')
export const INCOME_CATS  = Object.keys(CATS).filter((k) => CATS[k].k === 'income')

/* Month names. MN = full ("January"), SN = short ("Jan").
   A date like "2026-06" has month "06", so MN[6 - 1] === "June". */
export const MN = ['January','February','March','April','May','June','July','August','September','October','November','December']
export const SN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

/* Starting monthly spending limit for each expense category (the user can edit these). */
export const DEFAULT_BUDGETS = {
  Groceries: 400, Housing: 1200, Transport: 150, Dining: 250,
  Entertainment: 120, Utilities: 200, Shopping: 200, Health: 100, Other: 100,
}

/* The "no filters applied" state for the Transactions page. Defined once here so
   App's initial state and the Transactions "Clear" button can't drift apart. */
export const FILTER_DEFAULTS = { category: 'all', type: 'all', from: '', to: '', search: '' }

/* The fake transaction history the app loads with.
   Each transaction has: a unique id, a date (YYYY-MM-DD), a type
   ('income' or 'expense'), a category, an amount, and a description. */
export const SEED_TXNS = [
  { id: 1,  date: '2026-06-01', type: 'income',  category: 'Salary',        amount: 3200,   description: 'Monthly salary' },
  { id: 2,  date: '2026-06-03', type: 'expense', category: 'Housing',       amount: 1200,   description: 'Rent' },
  { id: 3,  date: '2026-06-02', type: 'expense', category: 'Transport',     amount: 60,     description: 'Metro pass' },
  { id: 4,  date: '2026-06-05', type: 'expense', category: 'Groceries',     amount: 78.40,  description: 'Supermarket' },
  { id: 5,  date: '2026-06-07', type: 'expense', category: 'Utilities',     amount: 145,    description: 'Electricity & water' },
  { id: 6,  date: '2026-06-08', type: 'expense', category: 'Dining',        amount: 42,     description: 'Dinner with friends' },
  { id: 7,  date: '2026-06-10', type: 'expense', category: 'Entertainment', amount: 35,     description: 'Cinema' },
  { id: 8,  date: '2026-06-11', type: 'expense', category: 'Health',        amount: 40,     description: 'Pharmacy' },
  { id: 9,  date: '2026-06-12', type: 'income',  category: 'Freelance',     amount: 600,    description: 'Design project' },
  { id: 10, date: '2026-06-14', type: 'expense', category: 'Shopping',      amount: 210,    description: 'New jacket' },
  { id: 11, date: '2026-06-15', type: 'expense', category: 'Transport',     amount: 110,    description: 'Train tickets' },
  { id: 12, date: '2026-06-16', type: 'expense', category: 'Other',         amount: 25,     description: 'Gift' },
  { id: 13, date: '2026-06-18', type: 'expense', category: 'Groceries',     amount: 52.10,  description: 'Groceries' },
  { id: 14, date: '2026-06-19', type: 'expense', category: 'Entertainment', amount: 120,    description: 'Concert tickets' },
  { id: 15, date: '2026-06-20', type: 'expense', category: 'Dining',        amount: 63.50,  description: 'Restaurant' },
  { id: 16, date: '2026-06-22', type: 'expense', category: 'Groceries',     amount: 96.30,  description: 'Weekly shop' },
  { id: 17, date: '2026-06-23', type: 'expense', category: 'Dining',        amount: 88,     description: 'Birthday dinner' },
  { id: 18, date: '2026-05-01', type: 'income',  category: 'Salary',        amount: 3200,   description: 'Monthly salary' },
  { id: 19, date: '2026-05-03', type: 'expense', category: 'Housing',       amount: 1200,   description: 'Rent' },
  { id: 20, date: '2026-05-06', type: 'expense', category: 'Groceries',     amount: 180,    description: 'Groceries' },
  { id: 21, date: '2026-05-12', type: 'expense', category: 'Groceries',     amount: 165,    description: 'Groceries' },
  { id: 22, date: '2026-05-09', type: 'expense', category: 'Dining',        amount: 130,    description: 'Dining out' },
  { id: 23, date: '2026-05-14', type: 'expense', category: 'Transport',     amount: 120,    description: 'Transport' },
  { id: 24, date: '2026-05-18', type: 'expense', category: 'Utilities',     amount: 158,    description: 'Utilities' },
  { id: 25, date: '2026-05-22', type: 'expense', category: 'Shopping',      amount: 95,     description: 'Shopping' },
  { id: 26, date: '2026-05-25', type: 'expense', category: 'Entertainment', amount: 70,     description: 'Streaming & events' },
  { id: 27, date: '2026-05-20', type: 'income',  category: 'Freelance',     amount: 450,    description: 'Freelance' },
  { id: 28, date: '2026-04-01', type: 'income',  category: 'Salary',        amount: 3100,   description: 'Monthly salary' },
  { id: 29, date: '2026-04-03', type: 'expense', category: 'Housing',       amount: 1200,   description: 'Rent' },
  { id: 30, date: '2026-04-08', type: 'expense', category: 'Groceries',     amount: 360,    description: 'Groceries' },
  { id: 31, date: '2026-04-12', type: 'expense', category: 'Dining',        amount: 175,    description: 'Dining out' },
  { id: 32, date: '2026-04-15', type: 'expense', category: 'Transport',     amount: 140,    description: 'Transport' },
  { id: 33, date: '2026-04-18', type: 'expense', category: 'Utilities',     amount: 150,    description: 'Utilities' },
  { id: 34, date: '2026-03-01', type: 'income',  category: 'Salary',        amount: 3100,   description: 'Monthly salary' },
  { id: 35, date: '2026-03-05', type: 'expense', category: 'Housing',       amount: 1200,   description: 'Rent' },
  { id: 36, date: '2026-03-10', type: 'expense', category: 'Groceries',     amount: 340,    description: 'Groceries' },
  { id: 37, date: '2026-03-16', type: 'expense', category: 'Dining',        amount: 160,    description: 'Dining out' },
  { id: 38, date: '2026-02-01', type: 'income',  category: 'Salary',        amount: 3000,   description: 'Monthly salary' },
  { id: 39, date: '2026-02-05', type: 'expense', category: 'Housing',       amount: 1200,   description: 'Rent' },
  { id: 40, date: '2026-02-12', type: 'expense', category: 'Groceries',     amount: 320,    description: 'Groceries' },
  { id: 41, date: '2026-01-01', type: 'income',  category: 'Salary',        amount: 3000,   description: 'Monthly salary' },
  { id: 42, date: '2026-01-05', type: 'expense', category: 'Housing',       amount: 1200,   description: 'Rent' },
  { id: 43, date: '2026-01-14', type: 'expense', category: 'Groceries',     amount: 300,    description: 'Groceries' },
]

/* Which symbol to show for each currency code. */
export const CUR_SYMBOL = { EUR: '€', USD: '$', GBP: '£' }

/* The currencies the app can display. EUR is the base everything is stored in. */
export const CURRENCIES = ['EUR', 'USD', 'GBP']

/* Fallback exchange rates relative to EUR — used until (or if) the live rates
   load. Rates move daily, so these are only an offline safety net. */
export const FALLBACK_RATES = { EUR: 1, USD: 1.08, GBP: 0.85 }

/* The rates actually used for conversion. Starts at the fallback and is
   replaced by setRates() once live rates arrive from the API. */
let activeRates = { ...FALLBACK_RATES }

/* Swap in a new set of rates (e.g. freshly fetched). EUR is pinned to 1 since
   every stored amount is already in EUR. */
export const setRates = (rates) => { activeRates = { ...activeRates, ...rates, EUR: 1 } }

/* Exchange rate for a code, falling back to 1 (EUR) for anything unknown. */
export const rate = (cur) => activeRates[cur] || 1

/* Fetch current EUR-based rates from Frankfurter (free, no key, ECB data).
   Returns a rates object like { USD: 1.08, GBP: 0.85 }; throws on failure
   so the caller can fall back to FALLBACK_RATES. */
export const fetchRates = async () => {
  const symbols = CURRENCIES.filter((c) => c !== 'EUR').join(',')
  const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=EUR&symbols=${symbols}`)
  if (!res.ok) throw new Error(`rates request failed: HTTP ${res.status}`)
  const data = await res.json()
  return data.rates
}

/* Convert a base-currency (EUR) amount into the given display currency. */
export const convert = (n, cur) => (Number(n) || 0) * rate(cur)

/* Convert an amount typed in the given display currency back to base (EUR),
   so everything stays stored in one currency regardless of what's on screen. */
export const toBase = (n, cur) => (Number(n) || 0) / rate(cur)

/* The most recent transaction date in the data, e.g. "2026-06-23".
   We derive it instead of hard-coding so "this month" (below) and the
   default date for new transactions always follow the actual data. */
export const LATEST_DATE = SEED_TXNS.reduce((max, t) => (t.date > max ? t.date : max), '')

/* The month the dashboard treats as "this month" — the month of the most
   recent transaction. Derived from LATEST_DATE so new transactions added
   in that month show up in the dashboard totals. */
export const CURRENT_MONTH = LATEST_DATE.slice(0, 7)

/* ---- Small formatting helpers used all over the UI ---- */

/* Currency symbol for a code, falling back to € for anything unknown. */
export const sym = (cur) => CUR_SYMBOL[cur] || '€'

/* Format a base-currency (EUR) number as money in the display currency,
   e.g. fmt(1200, 'USD') -> "$1,296.00". Amounts are stored in EUR and
   converted here, so switching currency recalculates the actual value.
   Math.abs() drops the sign — callers add their own +/− prefix. */
export const fmt = (n, cur) =>
  sym(cur) + Math.abs(convert(n, cur)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/* Format a transaction amount WITH its sign, e.g. fmtSigned(42, 'expense', 'EUR')
   -> "−€42.00", fmtSigned(600, 'income', 'EUR') -> "+€600.00".
   Used anywhere a transaction amount is shown so the sign style stays consistent. */
export const fmtSigned = (amount, type, cur) => (type === 'income' ? '+' : '−') + fmt(amount, cur)

/* Colour for a category, with a grey fallback if the category is unknown. */
export const catColor = (c) => CATS[c]?.c ?? '#7a8190'

/* Sort comparator: newest transaction first; ties broken by id so the
   more recently added (higher id) wins. Use with [...txns].sort(byNewest). */
export const byNewest = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id)

/* "2026-06" -> "June 2026".  (split('-') gives ['2026','06']; +p[1] turns '06' into 6.) */
export const monthName = (key) => { const p = key.split('-'); return MN[+p[1] - 1] + ' ' + p[0] }

/* "2026-06-24" -> "24 Jun 2026". */
export const dateLabel = (d) => { const p = d.split('-'); return +p[2] + ' ' + SN[+p[1] - 1] + ' ' + p[0] }

/* The `count` months ending at (and including) `endKey` ("YYYY-MM"), oldest first.
   e.g. lastMonths('2026-06', 6) -> ['2026-01','2026-02',...,'2026-06'].
   Correctly rolls back across year boundaries (handled by the Date object). */
export const lastMonths = (endKey, count) => {
  const [y, m] = endKey.split('-').map(Number)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(y, m - 1 - (count - 1 - i), 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
}
