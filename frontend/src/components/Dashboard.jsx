import { fmt, fmtSigned, catColor, monthName, CURRENT_MONTH } from '../data.js'
import Card from './Card.jsx'
import BudgetBar from './BudgetBar.jsx'
import './Dashboard.css'

/* ============================================================
   Dashboard — the overview page (KPI cards, donut, trend,
   budgets, recent activity).
   It only displays data: everything it shows comes in via the
   `metrics` prop that App calculated.
   ============================================================ */

/* The three layout presets the user can switch between. */
const LAYOUTS = ['Balanced', 'Charts', 'Compact']

/* The dashboard is a 12-column CSS grid. Each widget needs two things:
     - span:  how many of the 12 columns it takes up
     - order: where it appears in the sequence
   LAYOUT_DEFS holds those as [span, order] pairs for every widget, one
   row per preset. Switching layout just swaps which row we read.
   (e.g. in the "Charts" preset the donut/trend move to the top.) */
const LAYOUT_DEFS = [
  { kpi1:[3,1], kpi2:[3,2], kpi3:[3,3], kpi4:[3,4], donut:[12,5], trend:[12,6], budgets:[7,7], recent:[5,8] },
  { kpi1:[3,3], kpi2:[3,4], kpi3:[3,5], kpi4:[3,6], donut:[12,1], trend:[12,2], budgets:[7,7], recent:[5,8] },
  { kpi1:[3,1], kpi2:[3,2], kpi3:[3,3], kpi4:[3,4], donut:[12,5], trend:[12,6], budgets:[7,8], recent:[5,7] },
]

/* Turn one preset row into the inline `style` objects each Card wants,
   e.g. { kpi1: { gridColumn: 'span 3', order: 1 }, ... }. */
function layoutStyles(L) {
  const mk = ([span, order]) => ({ gridColumn: `span ${span}`, order })
  return Object.fromEntries(
    Object.entries(LAYOUT_DEFS[L] ?? LAYOUT_DEFS[0]).map(([k, v]) => [k, mk(v)])
  )
}

export default function Dashboard({ metrics, currency, layout, setLayout, onEdit }) {
  /* Pull the pieces we need out of the metrics object App passed in. */
  const {
    totalSpent, totalIncome, net,
    legend, donutGradient,
    trend,
    budgetStatus,
    recent,
    budgetUsedPct, overCount,
  } = metrics

  const gs = layoutStyles(layout)        // grid styles for the current preset
  const f  = (n) => fmt(n, currency)     // shortcut: format a number as money

  /* The first three KPI cards are identical in shape, so we describe them as
     data and render them in a loop below (less copy-paste). The 4th card
     (Budget used) has a progress bar, so it's written out separately. */
  const kpiCards = [
    { style: gs.kpi1, title: 'Spent this month',  value: f(totalSpent),                  sub: 'across all categories', cls: '' },
    { style: gs.kpi2, title: 'Income this month', value: f(totalIncome),                 sub: 'salary & freelance',    cls: 'kpi-value--green' },
    { style: gs.kpi3, title: 'Net this month',    value: (net < 0 ? '−' : '+') + f(net), sub: 'income − expenses',     cls: net >= 0 ? 'kpi-value--green' : 'kpi-value--red' },
  ]

  return (
    <>
      {/* ---- Top bar: month label + the layout switcher buttons ---- */}
      <div className="dash-header">
        <div className="dash-month">Overview for {monthName(CURRENT_MONTH)}</div>
        <div className="layout-switcher">
          {LAYOUTS.map((label, i) => (
            <button
              key={label}
              className={`layout-btn ${layout === i ? 'active' : ''}`}
              onClick={() => setLayout(i)}   // i is the preset index (0/1/2)
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ---- The widget grid ---- */}
      <div className="dash-grid">

        {/* KPI cards 1-3, rendered from the kpiCards array above. */}
        {kpiCards.map(({ style, title, value, sub, cls }) => (
          <Card key={title} style={style} className="dash-kpi">
            <span className="kpi-title">{title}</span>
            <div className={`kpi-value ${cls}`}>{value}</div>
            <div className="kpi-subtitle">{sub}</div>
          </Card>
        ))}

        {/* KPI card 4 — "Budget used", with a progress bar and an over-budget badge. */}
        <Card style={gs.kpi4} className="dash-kpi">
          <div className="kpi-header">
            <span className="kpi-title">Budget used</span>
            {overCount > 0 && <span className="over-badge">{overCount} over</span>}
          </div>
          <div className="kpi-value">{Math.round(budgetUsedPct)}%</div>
          <div className="kpi-progress-track">
            <div className="kpi-progress-fill" style={{ width: `${budgetUsedPct}%` }} />
          </div>
        </Card>

        {/* ---- Donut chart: spending split by category ---- */}
        <Card style={gs.donut}>
          <div className="donut-title">Spending by category</div>
          <div className="donut-body">
            {/* The coloured ring is a CSS conic-gradient (built in App's metrics).
                The white circle in the middle shows the total. */}
            <div className="donut-chart">
              <div className="donut-circle" style={{ background: donutGradient }} />
              <div className="donut-center">
                <span className="donut-center__label">Total</span>
                <span className="donut-center__value">{f(totalSpent)}</span>
              </div>
            </div>
            {/* Legend: one row per category with its colour, %, and amount. */}
            <div className="donut-legend">
              {legend.map((g) => (
                <div key={g.name} className="legend-row">
                  <span className="legend-dot" style={{ background: g.color }} />
                  <span className="legend-name">{g.name}</span>
                  <span className="legend-pct">{g.pctLabel}</span>
                  <span className="legend-amount">{f(g.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* ---- Trend chart: income vs expense over 6 months ---- */}
        <Card style={gs.trend}>
          <div className="trend-header">
            <div className="trend-title">Income vs expense</div>
            <div className="trend-legend">
              <span className="trend-legend__item">
                <span className="trend-legend__dot trend-legend__dot--income" />Income
              </span>
              <span className="trend-legend__item">
                <span className="trend-legend__dot trend-legend__dot--expense" />Expense
              </span>
            </div>
          </div>
          {/* One column per month, each with an income bar and an expense bar.
              Heights (incH/expH) are percentages App already worked out. */}
          <div className="trend-bars">
            {trend.map((t) => (
              <div key={t.label} className="trend-col">
                <div className="trend-col__pair">
                  <div className="trend-bar trend-bar--income"  style={{ height: `${t.incH}%` }} />
                  <div className="trend-bar trend-bar--expense" style={{ height: `${t.expH}%` }} />
                </div>
                <span className="trend-col__label">{t.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* ---- Budget vs actual: a mini progress bar per category ---- */}
        <Card style={gs.budgets}>
          <div className="budget-card-title">Budget vs actual</div>
          {budgetStatus.map((b) => (
            <div key={b.name} className="budget-row">
              <div className="budget-row__header">
                <div className="budget-row__left">
                  <span className="budget-dot" style={{ background: b.color }} />
                  <span className="budget-name">{b.name}</span>
                  {b.over && <span className="over-tag">OVER</span>}
                </div>
                <span className="budget-amounts">{f(b.spent)} / {f(b.limit)}</span>
              </div>
              <BudgetBar pct={b.pct} over={b.over} color={b.color} />
            </div>
          ))}
        </Card>

        {/* ---- Recent activity: newest transactions; click one to edit it ---- */}
        <Card style={gs.recent}>
          <div className="recent-title">Recent activity</div>
          {recent.map((r) => (
            <div key={r.id} className="recent-row" onClick={() => onEdit(r.id)}>
              <span className="recent-dot" style={{ background: catColor(r.category) }} />
              <div className="recent-info">
                <div className="recent-info__title">{r.description || r.category}</div>
                <div className="recent-info__sub">{r.category}</div>
              </div>
              <span className={`recent-amount recent-amount--${r.type}`}>
                {fmtSigned(r.amount, r.type, currency)}
              </span>
            </div>
          ))}
        </Card>

      </div>
    </>
  )
}
