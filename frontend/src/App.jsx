import { useState, useMemo, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import {
  SN, SEED_TXNS, DEFAULT_BUDGETS, FILTER_DEFAULTS, CURRENT_MONTH, EXPENSE_CATS,
  fmt, catColor, monthName, sym, byNewest, lastMonths, fetchRates, setRates,
} from './data.js'
import AuthScreen   from './components/AuthScreen.jsx'
import TxnModal     from './components/TxnModal.jsx'
import Dashboard    from './components/Dashboard.jsx'
import Transactions from './components/Transactions.jsx'
import Budgets      from './components/Budgets.jsx'
import './App.css'

/* The sidebar links. Each one is a label + the URL it navigates to.
   Adding a page is as simple as adding an entry here (plus a <Route> below). */
const NAV = [
  { label: 'Dashboard',    path: '/dashboard'    },
  { label: 'Transactions', path: '/transactions' },
  { label: 'Budgets',      path: '/budgets'      },
]

/* ============================================================
   App — the top-level component.
   It owns ALL the shared state (the user, their transactions,
   budgets, etc.) and passes pieces of it down to each page.
   The pages themselves don't hold data; they just display what
   App gives them and call App's handlers to make changes.
   ============================================================ */
export default function App({ brand = 'Balancer' }) {

  /* ---- All app state lives here ---- */
  const [user,     setUser]     = useState(null)            // null = logged out; an object = logged in
  const [currency, setCurrency] = useState('EUR')           // which currency symbol to display
  const [layout,   setLayout]   = useState(0)               // dashboard layout preset (0/1/2)
  const [txns,     setTxns]     = useState(SEED_TXNS)        // the list of transactions
  const [budgets,  setBudgets]  = useState(DEFAULT_BUDGETS)  // spending limit per category
  const [modal,    setModal]    = useState(null)            // add/edit popup: null = closed, {} = add, {…} = edit
  const [filters,  setFilters]  = useState(FILTER_DEFAULTS) // active filters on the Transactions page
  const [, setRatesV]           = useState(0)               // bumped to re-render once live rates load

  /* Pull current exchange rates once on load. They live in a module variable
     (used by the fmt/convert helpers), so on success we bump a counter to
     re-render with the fresh numbers. On failure we keep the static fallback. */
  useEffect(() => {
    let alive = true
    fetchRates()
      .then((rates) => { if (alive) { setRates(rates); setRatesV((v) => v + 1) } })
      .catch((err) => console.warn('Using fallback exchange rates:', err))
    return () => { alive = false }
  }, [])

  /* react-router hooks: navigate() changes the URL, location tells us the current URL. */
  const navigate = useNavigate()
  const location = useLocation()

  /* ============================================================
     Metrics are split into two memos so editing a budget limit doesn't
     needlessly recompute the donut/trend/recent (which only depend on txns):

       txnMetrics    — everything derived from transactions alone  → keyed [txns]
       budgetMetrics — budget vs spending numbers                  → keyed [txnMetrics, budgets]

     `metrics` just merges them so the pages still read one object.
     ============================================================ */

  /* ---- Everything that depends only on the transactions ---- */
  const txnMetrics = useMemo(() => {
    /* Two tiny helpers used throughout this calculation:
       inMonth -> is this transaction in month "k" (e.g. "2026-06")?
       sum     -> add up the `amount` of a list of transactions. */
    const inMonth = (t, k) => t.date.slice(0, 7) === k
    const sum     = (arr)  => arr.reduce((a, t) => a + t.amount, 0)

    /* This month's expenses and income, and the headline totals. */
    const tmExp = txns.filter((t) => t.type === 'expense' && inMonth(t, CURRENT_MONTH))
    const tmInc = txns.filter((t) => t.type === 'income'  && inMonth(t, CURRENT_MONTH))
    const totalSpent  = sum(tmExp)
    const totalIncome = sum(tmInc)
    const net         = totalIncome - totalSpent  // positive = saved money, negative = overspent

    /* ---- Donut chart: how much was spent in each category ---- */
    /* byCat = { Groceries: 226.8, Housing: 1200, ... } */
    const byCat = {}
    tmExp.forEach((t) => { byCat[t.category] = (byCat[t.category] || 0) + t.amount })

    /* Turn that into a sorted list (biggest spender first) with a colour each. */
    const breakdown = Object.keys(byCat)
      .map((c) => ({ name: c, amount: byCat[c], color: catColor(c) }))
      .sort((a, b) => b.amount - a.amount)

    /* The donut is drawn with a CSS conic-gradient. We build a string like
       "conic-gradient(#color 0% 25%, #color2 25% 60%, ...)" where each slice
       covers its share of the circle. `acc` tracks where the previous slice ended. */
    let acc = 0
    const segs = breakdown.map((b) => {
      const pct = totalSpent > 0 ? (b.amount / totalSpent) * 100 : 0
      const seg = `${b.color} ${acc.toFixed(2)}% ${(acc + pct).toFixed(2)}%`
      acc += pct
      return seg
    })
    const donutGradient = totalSpent > 0
      ? `conic-gradient(${segs.join(',')})`
      : 'conic-gradient(#e4e8f0 0% 100%)'  // nothing spent yet -> plain grey ring

    /* The legend next to the donut: each category + its percentage label. */
    const legend = breakdown.map((b) => ({
      ...b,
      pctLabel: (totalSpent > 0 ? Math.round((b.amount / totalSpent) * 100) : 0) + '%',
    }))

    /* ---- Trend chart: income vs expense for the 6 months ending at CURRENT_MONTH ---- */
    /* Derived from the data so it stays in step with the rest of the app. */
    const months = lastMonths(CURRENT_MONTH, 6)
    /* Total up each month in ONE pass over txns instead of scanning the list
       once per month. bucket["2026-06"] = { e: expenses, i: income }. */
    const bucket = {}
    months.forEach((k) => { bucket[k] = { e: 0, i: 0 } })
    txns.forEach((t) => {
      const k = t.date.slice(0, 7)
      if (bucket[k]) bucket[k][t.type === 'income' ? 'i' : 'e'] += t.amount
    })
    /* Bar heights are a percentage of the tallest bar, so the chart always fills
       its box. maxVal is the biggest single value across all months (min 1 to avoid ÷0). */
    const maxVal = Math.max(1, ...months.map((k) => Math.max(bucket[k].e, bucket[k].i)))
    const trend = months.map((k) => ({
      label: SN[+k.slice(5, 7) - 1],            // "2026-06" -> "Jun"
      incH:  (bucket[k].i / maxVal) * 100,      // income bar height, as a %
      expH:  (bucket[k].e / maxVal) * 100,      // expense bar height, as a %
    }))

    /* ---- The 6 newest transactions, for the "Recent activity" widget ---- */
    const recent = [...txns].sort(byNewest).slice(0, 6)

    return { byCat, totalSpent, totalIncome, net, legend, donutGradient, trend, recent }
  }, [txns])

  /* ---- Budget numbers: depend on the per-category spend (from txnMetrics) and the limits ---- */
  const budgetMetrics = useMemo(() => {
    const { byCat, totalSpent } = txnMetrics

    const budgetStatus = EXPENSE_CATS.map((c) => {
      const limit = Number(budgets[c] || 0)
      const spent = byCat[c] || 0
      const pct   = limit > 0 ? (spent / limit) * 100 : 0
      const over  = limit > 0 && spent > limit
      // pct is capped at 100 so the progress bar never overflows its track.
      return { name: c, color: catColor(c), over, pct: Math.min(100, pct), spent, limit }
    })

    const totalBudget   = EXPENSE_CATS.reduce((a, c) => a + Number(budgets[c] || 0), 0)
    const overCount     = budgetStatus.filter((b) => b.over).length          // how many categories are over
    const budgetUsedPct = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0

    return { budgetStatus, totalBudget, overCount, budgetUsedPct }
  }, [txnMetrics, budgets])

  /* Merge the two into the single `metrics` object the pages read from. */
  const metrics = useMemo(() => ({ ...txnMetrics, ...budgetMetrics }), [txnMetrics, budgetMetrics])

  /* ============================================================
     Handlers that change the transaction list. The modal calls these.
     Note: we update state with a function (prev => ...) so we're always
     working from the latest list, never a stale copy.
     ============================================================ */

  /* Save the modal: if the transaction already has an id we're editing
     (replace it); otherwise it's new (give it a fresh id and add it on top). */
  const saveTxn = (t) => {
    if (t.id) {
      setTxns((prev) => prev.map((x) => (x.id === t.id ? { ...x, ...t } : x)))
    } else {
      setTxns((prev) => {
        // New id = one more than the current highest id in the list.
        const id = prev.reduce((max, x) => Math.max(max, x.id), 0) + 1
        return [{ ...t, id }, ...prev]
      })
    }
    setModal(null)  // close the popup
  }

  /* Remove a transaction by id, then close the popup. */
  const deleteTxn = (id) => {
    setTxns((prev) => prev.filter((x) => x.id !== id))
    setModal(null)
  }

  /* Open the modal pre-filled with an existing transaction (edit mode). */
  const openEdit = (id) => {
    const found = txns.find((x) => x.id === id)
    if (found) setModal(found)
  }

  /* ============================================================
     If nobody is logged in, show ONLY the auth screens.
     Any other URL is bounced to /login by the catch-all route.
     ============================================================ */
  if (!user) {
    return (
      <Routes>
        <Route path="/login"  element={<AuthScreen mode="login"  brand={brand} onToggle={() => navigate('/signup')} onSubmit={(u) => { setUser(u); navigate('/dashboard') }} />} />
        <Route path="/signup" element={<AuthScreen mode="signup" brand={brand} onToggle={() => navigate('/login')}  onSubmit={(u) => { setUser(u); navigate('/dashboard') }} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  /* ---- Values used by the shell below ---- */
  // First letter of the user's name (or email) for the little avatar circle.
  const userInitial = ((user?.name || user?.email || 'A').trim()[0] || 'A').toUpperCase()
  const { totalSpent, totalBudget, budgetUsedPct } = metrics
  const currentPath  = location.pathname
  // The header title is just the label of whichever NAV link matches the URL.
  const pageTitle    = NAV.find((n) => n.path === currentPath)?.label ?? brand

  /* ============================================================
     The logged-in app: sidebar on the left, header + page on the right.
     ============================================================ */
  return (
    <div className="app">

      {/* ---- Left sidebar: logo, nav links, mini budget widget ---- */}
      <aside className="sidebar">
        <div className="sidebar__logo">
          <div className="sidebar__logo-icon">B</div>
          <span className="sidebar__logo-name">{brand}</span>
        </div>

        {/* One button per NAV entry. The one matching the current URL gets "active". */}
        {NAV.map((n) => (
          <button
            key={n.path}
            className={`sidebar__nav-btn ${currentPath === n.path ? 'active' : ''}`}
            onClick={() => navigate(n.path)}
          >
            {n.label}
          </button>
        ))}

        {/* Little "budget used this month" progress widget pinned to the bottom. */}
        <div className="sidebar__widget">
          <div className="sidebar__widget-label">Budget used · {monthName(CURRENT_MONTH)}</div>
          <div className="sidebar__widget-value">{Math.round(budgetUsedPct)}%</div>
          <div className="sidebar__widget-track">
            <div className="sidebar__widget-fill" style={{ width: `${budgetUsedPct}%` }} />
          </div>
          <div className="sidebar__widget-details">
            {fmt(totalSpent, currency)} of {fmt(totalBudget, currency)}
          </div>
        </div>
      </aside>

      {/* ---- Right side: sticky header + the current page ---- */}
      <div className="app-main">
        <header className="app-header">
          <div>
            <h1 className="app-header__title">{pageTitle}</h1>
            <div className="app-header__subtitle">{monthName(CURRENT_MONTH)}</div>
          </div>

          <div className="app-header__controls">
            {/* Currency switcher: clicking € / $ / £ changes how all amounts are shown. */}
            <div className="currency-switcher">
              {['EUR', 'USD', 'GBP'].map((c) => (
                <button
                  key={c}
                  className={`currency-btn ${currency === c ? 'active' : ''}`}
                  onClick={() => setCurrency(c)}
                >
                  {sym(c)}
                </button>
              ))}
            </div>

            {/* Opening the modal with an empty object ({}) puts it in "add" mode. */}
            <button className="add-txn-btn" onClick={() => setModal({})}>
              <span className="add-txn-btn__plus">+</span>
              <span className="add-txn-btn__text">Add transaction</span>
            </button>

            <div className="user-controls">
              <div className="user-avatar">{userInitial}</div>
              {/* Logging out clears the user and sends them back to /login. */}
              <button className="logout-btn" onClick={() => { setUser(null); navigate('/login') }}>
                Log out
              </button>
            </div>
          </div>
        </header>

        {/* The page area. Which component shows depends on the URL.
            Each page receives the slices of state and handlers it needs. */}
        <main className="app-content">
          <Routes>
            {/* "/" has no page of its own, so redirect it to the dashboard. */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"    element={<Dashboard metrics={metrics} currency={currency} layout={layout} setLayout={setLayout} onEdit={openEdit} />} />
            <Route path="/transactions" element={<Transactions txns={txns} currency={currency} filters={filters} setFilters={setFilters} onEdit={openEdit} onDelete={deleteTxn} />} />
            <Route path="/budgets"      element={<Budgets metrics={metrics} budgets={budgets} setBudgets={setBudgets} currency={currency} />} />
            {/* Any unknown URL falls back to the dashboard. */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {/* The add/edit popup. It only exists in the DOM while `modal` is set.
          We render it here (outside .app-main) so it can overlay the whole screen. */}
      {modal && (
        <TxnModal
          initial={modal}
          currency={currency}
          onClose={() => setModal(null)}
          onSave={saveTxn}
          onDelete={deleteTxn}
        />
      )}

    </div>
  )
}
