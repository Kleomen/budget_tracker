import { fmt, fmtSigned, catColor, monthName } from '../data.js'
import Card from './Card.jsx'
import BudgetBar from './BudgetBar.jsx'
import './Dashboard.css'

/* ============================================================
   Dashboard — the overview page.
   "Compact" shows the KPI cards, budget-vs-actual, and recent activity.
   "Charts" shows just the donut and trend charts.
   It only displays data: everything it shows comes in via the
   `metrics` prop that App calculated.
   ============================================================ */

const LAYOUTS = [
  { key: 'compact', label: 'Compact' },
   { key: 'charts',  label: 'Charts'  },
]

export default function Dashboard({ metrics, currency, layout, setLayout, onEdit, selectedMonth, setSelectedMonth, availableMonths }) {
  /* Pull the pieces we need out of the metrics object App passed in. */
  const {
    totalSpent, totalIncome, net,
    legend, donutGradient,
    trend,
    budgetStatus,
    recent,
    budgetUsedPct, overCount,
  } = metrics

  const f = (n) => fmt(n, currency)     // shortcut: format a number as money

  /* The first three KPI cards are identical in shape, so we describe them as
     data and render them in a loop below (less copy-paste). The 4th card
     (Budget used) has a progress bar, so it's written out separately. */
  const kpiCards = [
    { title: 'Spent this month',  value: f(totalSpent),                  sub: 'across all categories', cls: '' },
    { title: 'Income this month', value: f(totalIncome),                 sub: 'salary & freelance',    cls: 'kpi-value--green' },
    { title: 'Net this month',    value: (net < 0 ? '−' : '+') + f(net), sub: 'income − expenses',     cls: net >= 0 ? 'kpi-value--green' : 'kpi-value--red' },
  ]

  return (
    <>
      {/* ---- Top bar: month label + the layout switcher buttons ---- */}
      <div className="dash-header">
        <div className="dash-month">
          Overview for{' '}
          <select
            className="dash-month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {availableMonths.map((m) => (
              <option key={m} value={m}>{monthName(m)}</option>
            ))}
          </select>
        </div>
        <div className="layout-switcher">
          {LAYOUTS.map(({ key, label }) => (
            <button
              key={key}
              className={`layout-btn ${layout === key ? 'active' : ''}`}
              onClick={() => setLayout(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ---- The widget grid ---- */}
      <div className="dash-grid">

        {layout === 'compact' && (
          <>
            {/* KPI cards 1-3, rendered from the kpiCards array above. */}
            {kpiCards.map(({ title, value, sub, cls }) => (
              <Card key={title} className="dash-kpi">
                <span className="kpi-title">{title}</span>
                <div className={`kpi-value ${cls}`}>{value}</div>
                <div className="kpi-subtitle">{sub}</div>
              </Card>
            ))}

            {/* KPI card 4 — "Budget used", with a progress bar and an over-budget badge. */}
            <Card className="dash-kpi">
              <div className="kpi-header">
                <span className="kpi-title">Budget used</span>
                {overCount > 0 && <span className="over-badge">{overCount} over</span>}
              </div>
              <div className="kpi-value">{Math.round(budgetUsedPct)}%</div>
              <div className="kpi-progress-track">
                <div className="kpi-progress-fill" style={{ width: `${budgetUsedPct}%` }} />
              </div>
            </Card>

            {/* ---- Budget vs actual: a mini progress bar per category ---- */}
            <Card className="dash-budgets">
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
            <Card className="dash-recent">
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
          </>
        )}

        {layout === 'charts' && (
          <>
            {/* ---- Donut chart: spending split by category ---- */}
            <Card className="dash-donut">
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
            <Card className="dash-trend">
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
          </>
        )}

      </div>
    </>
  )
}
