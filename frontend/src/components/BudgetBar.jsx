import './BudgetBar.css'

/* ============================================================
   BudgetBar — the little progress bar used to show how much of a
   category's budget has been spent. Shared by the Dashboard's
   "Budget vs actual" card and the Budgets page so the two always
   look and behave the same.
   Props:
     - pct:   how full the bar is, 0–100
     - over:  true if the category is over its limit (bar goes red)
     - color: the category's normal colour (used when not over)
   ============================================================ */
export default function BudgetBar({ pct, over, color }) {
  return (
    <div className="budget-bar-track">
      <div
        className="budget-bar-fill"
        style={{ width: `${pct}%`, background: over ? 'var(--red)' : color }}
      />
    </div>
  )
}
