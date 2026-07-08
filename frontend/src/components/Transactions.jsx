import { useMemo } from 'react'
import { CATS, FILTER_DEFAULTS, fmt, fmtSigned, catColor, monthName, dateLabel, byNewest } from '../data.js'
import './Transactions.css'

/* ============================================================
   Transactions — the full, filterable list of transactions,
   grouped by month. App owns the data and the filter values;
   this component just filters/displays and reports changes back.
   ============================================================ */

/* Options for the category dropdown: "all" first, then every category. */
const FILTER_CATS = ['all', ...Object.keys(CATS)]

export default function Transactions({ txns, currency, filters, setFilters, onEdit, onDelete }) {
  const f = (n) => fmt(n, currency)  // shortcut: format a number as money

  /* Filtering + grouping is wrapped in useMemo so it only re-runs when the
     transactions or the filters change, not on every render.
     We do it in one pass: sort -> filter -> group by month. */
  const { filtered, groups } = useMemo(() => {
    /* 1. Sort newest first (ties broken by id so newer entries win). */
    const sorted = [...txns].sort(byNewest)

    /* 2. Keep only the transactions that pass every active filter.
          Each `if` rejects (returns false) the ones that don't match. */
    const filtered = sorted.filter((t) => {
      if (filters.type     !== 'all' && t.type     !== filters.type)     return false
      if (filters.category !== 'all' && t.category !== filters.category) return false
      if (filters.from               && t.date < filters.from)           return false
      if (filters.to                 && t.date > filters.to)             return false
      if (filters.search) {
        // Match the search text against either the description or the category.
        const q = filters.search.toLowerCase()
        if (!(t.description || '').toLowerCase().includes(q) && !t.category.toLowerCase().includes(q)) return false
      }
      return true
    })

    /* 3. Group the survivors by month. gm["2026-06"] = [ ...that month's txns ].
          Because `filtered` is already sorted newest-first, the months come
          out newest-first too, so we don't need to sort the keys again. */
    const gm = {}
    filtered.forEach((t) => {
      const k = t.date.slice(0, 7)            // "2026-06-24" -> "2026-06"
      ;(gm[k] = gm[k] || []).push(t)
    })
    const groups = Object.keys(gm).map((k) => ({
      key:   k,
      label: monthName(k),
      // Month header shows total *expenses* only (income isn't "spending").
      total: gm[k].filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0),
      items: gm[k],
    }))

    return { filtered, groups }
  }, [txns, filters])

  /* Update a single filter field, leaving the others untouched. */
  const set = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }))

  /* True if any filter differs from its default — controls the "Clear" button. */
  const hasFilters = Object.keys(FILTER_DEFAULTS).some((k) => filters[k] !== FILTER_DEFAULTS[k])

  return (
    <>
      {/* ---- Filter toolbar: search box, type, category, date range ---- */}
      <div className="filter-bar">
        <div className="filter-search">
          <label className="filter-label">Search</label>
          <input
            className="filter-input"
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            placeholder="Description or category…"
          />
        </div>

        <div>
          <label className="filter-label">Type</label>
          <select className="filter-select" value={filters.type} onChange={(e) => set('type', e.target.value)}>
            <option value="all">All</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        <div>
          <label className="filter-label">Category</label>
          <select className="filter-select" value={filters.category} onChange={(e) => set('category', e.target.value)}>
            {FILTER_CATS.map((c) => (
              <option key={c} value={c}>{c === 'all' ? 'All' : c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="filter-label">From</label>
          <input type="date" className="filter-input" value={filters.from} onChange={(e) => set('from', e.target.value)} />
        </div>

        <div>
          <label className="filter-label">To</label>
          <input type="date" className="filter-input" value={filters.to} onChange={(e) => set('to', e.target.value)} />
        </div>

        {/* Only show "Clear" when there's actually something to clear. */}
        {hasFilters && (
          <button className="filter-clear" onClick={() => setFilters(FILTER_DEFAULTS)}>
            Clear
          </button>
        )}
      </div>

      {/* ---- Result count (with correct singular/plural) ---- */}
      <div className="txn-count">
        {filtered.length} {filtered.length === 1 ? 'transaction' : 'transactions'}
      </div>

      {/* ---- Empty state, shown when nothing matches the filters ---- */}
      {groups.length === 0 && (
        <div className="txn-empty">
          <div className="txn-empty__title">No transactions found</div>
          <div className="txn-empty__sub">Try adjusting your filters or add a new transaction.</div>
        </div>
      )}

      {/* ---- One section per month, each listing that month's transactions ---- */}
      {groups.map((g) => (
        <div key={g.key} className="txn-group">
          <div className="txn-group__header">
            <span className="txn-group__month">{g.label}</span>
            <span className="txn-group__total">Spent {f(g.total)}</span>
          </div>

          <div className="txn-list">
            {g.items.map((r) => (
              <div key={r.id} className="txn-row">
                {/* Coloured square = the category's colour. */}
                <span className="txn-row__icon" style={{ background: catColor(r.category) }} />
                <div className="txn-row__info">
                  <div className="txn-row__title">{r.category}</div>
                  <div className="txn-row__sub">{dateLabel(r.date)}</div>
                  {r.description && <div className="txn-row__desc">{r.description}</div>}
                </div>
                {/* Income shows "+", expense shows "−". */}
                <span className={`txn-row__amount txn-row__amount--${r.type}`}>
                  {fmtSigned(r.amount, r.type, currency)}
                </span>
                {/* These call back up to App (via props) to edit/remove the row. */}
                <button className="txn-row__edit"   onClick={() => onEdit(r.id)}>Edit</button>
                <button className="txn-row__delete" onClick={() => onDelete(r.id)}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
