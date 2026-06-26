import { fmt, sym, monthName, CURRENT_MONTH } from '../data.js'
import Card from './Card.jsx'
import BudgetBar from './BudgetBar.jsx'
import './Budgets.css'

/* ============================================================
   Budgets
   Left panel: editable per-category limits with progress bars.
   Right sidebar: overall usage summary and an over-budget alert.
   ============================================================ */
export default function Budgets({ metrics, budgets, setBudgets, currency }) {
  const f = (n) => fmt(n, currency)
  const { budgetStatus, totalBudget, totalSpent, budgetUsedPct, overCount } = metrics

  /* Update one category's limit; empty string is allowed so the user
     can clear the field before typing a new number */
  const updateLimit = (name, raw) =>
    setBudgets((prev) => ({
      ...prev,
      [name]: raw === '' ? '' : Number(raw),
    }))

  return (
    <div className="budgets-grid">

      {/* ---- Left panel: per-category limit editor ---- */}
      <Card className="budget-list">
        <div className="budget-list__title">Monthly budget limits</div>
        <div className="budget-list__subtitle">
          Set a limit per category. Spending is tracked against {monthName(CURRENT_MONTH)}.
        </div>

        {budgetStatus.map((b) => (
          <div key={b.name} className="budget-item">

            {/* Category colour dot */}
            <span className="budget-item__dot" style={{ background: b.color }} />

            <div className="budget-item__body">
              {/* Name row + "OVER" tag + remaining amount */}
              <div className="budget-item__name-row">
                <div className="budget-item__name-left">
                  <span className="budget-item__name">{b.name}</span>
                  {b.over && <span className="budget-item__over-tag">OVER</span>}
                </div>
                {/* With no limit set (cleared/0) show "No limit" rather than
                    misreporting all spending as "over". */}
                <span className={`budget-item__remaining budget-item__remaining--${b.over ? 'over' : 'ok'}`}>
                  {b.limit <= 0
                    ? 'No limit'
                    : b.limit - b.spent >= 0
                      ? `${f(b.limit - b.spent)} left`
                      : `${f(b.spent - b.limit)} over`}
                </span>
              </div>

              {/* Progress bar — turns red when over budget */}
              <BudgetBar pct={b.pct} over={b.over} color={b.color} />

              <div className="budget-item__details">
                {b.limit > 0 ? `${f(b.spent)} spent of ${f(b.limit)}` : `${f(b.spent)} spent`}
              </div>
            </div>

            {/* Inline number input for changing the limit */}
            <div className="budget-item__input-group">
              <span className="budget-item__currency">{sym(currency)}</span>
              <input
                type="number"
                className="budget-item__input"
                value={budgets[b.name] ?? ''}
                onChange={(e) => updateLimit(b.name, e.target.value)}
              />
            </div>
          </div>
        ))}
      </Card>

      {/* ---- Right sidebar ---- */}
      <div className="budget-sidebar">

        {/* Dark summary widget */}
        <div className="budget-summary">
          <div className="budget-summary__label">Total budget used</div>
          <div className="budget-summary__value">{Math.round(budgetUsedPct)}%</div>
          <div className="budget-summary__bar-track">
            <div
              className="budget-summary__bar-fill"
              style={{ width: `${budgetUsedPct}%` }}
            />
          </div>
          <div className="budget-summary__details">
            {f(totalSpent)} of {f(totalBudget)}
          </div>
        </div>

        {/* Over-budget alert — only shown when at least one category is over */}
        {overCount > 0 && (
          <div className="budget-over-alert">
            <div className="budget-over-alert__row">
              <span className="budget-over-alert__icon">!</span>
              <span className="budget-over-alert__title">{overCount} over budget</span>
            </div>
            <div className="budget-over-alert__text">
              Some categories have exceeded their limit this month.
              Review them and adjust your spending or raise the limit.
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
