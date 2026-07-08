import { useState } from 'react'
import { EXPENSE_CATS, INCOME_CATS, sym, convert, toBase } from '../data.js'
import './TxnModal.css'

/* ============================================================
   TxnModal — the popup for adding or editing a transaction.
   `initial` decides the mode:
     - {}            -> "add" form (blank fields)
     - { id, ... }   -> "edit" form (pre-filled with that transaction)
   On save/delete it calls the handlers App passed in.
   ============================================================ */

/* Default date for a brand-new transaction: today. */
const DEFAULT_DATE = new Date().toISOString().slice(0, 10)

/* Round to 2 decimals so a converted amount shows cleanly in the input. */
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100

export default function TxnModal({ initial, currency, onClose, onSave, onDelete }) {
  const editing = !!initial.id  // true if we were given an existing transaction

  /* All the editable fields live in one `form` object. We start it from
     `initial` when editing, or from sensible defaults when adding. */
  const [form, setForm] = useState({
    type:        initial.type        || 'expense',
    /* Stored amounts are in base currency (EUR); show them in the currency
       the user is currently viewing so editing matches what's on screen. */
    amount:      initial.amount != null ? String(round2(convert(initial.amount, currency))) : '',
    category:    initial.category    || 'Groceries',
    date:        initial.date        || DEFAULT_DATE,
    description: initial.description || '',
  })
  const [error, setError] = useState('')  // validation message, '' when all good

  /* set('amount') returns an onChange handler that updates just that one field.
     Usage: <input onChange={set('amount')} /> */
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  /* Switching between Expense/Income also resets the category to a matching
     default (you can't put "Salary" on an expense). */
  const setKind = (k) => setForm((f) => ({
    ...f,
    type:     k,
    category: k === 'income' ? 'Salary' : 'Groceries',
  }))

  /* Which categories the dropdown offers depends on the chosen type. */
  const cats = form.type === 'expense' ? EXPENSE_CATS : INCOME_CATS

  /* Validate, then hand a clean transaction object back to App, which saves it
     via the API. We await so that if the save fails (e.g. server error) we can
     show the message and keep the dialog open instead of losing the entry. */
  const save = async () => {
    const amt = parseFloat(form.amount)
    if (!amt || amt <= 0) return setError('Enter an amount greater than 0.')
    if (!form.date)       return setError('Please choose a date.')
    /* The user typed the amount in the display currency — convert it back to
       base (EUR) so all stored amounts stay in one currency. */
    try {
      await onSave({ id: initial.id, amount: toBase(amt, currency), type: form.type, category: form.category, date: form.date, description: form.description })
    } catch (err) {
      setError(err.message || 'Could not save. Please try again.')
    }
  }

  return (
    /* The dark overlay covers the page; the white box is the actual dialog. */
    <div className="modal-overlay">
      <div className="modal-box">

        {/* Title changes with the mode; × closes without saving. */}
        <div className="modal-header">
          <h2 className="modal-title">{editing ? 'Edit transaction' : 'Add transaction'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Expense / Income toggle. */}
        <div className="txn-type-btns">
          <button
            className={`txn-type-btn txn-type-btn--expense ${form.type === 'expense' ? 'active' : ''}`}
            onClick={() => setKind('expense')}
          >
            Expense
          </button>
          <button
            className={`txn-type-btn txn-type-btn--income ${form.type === 'income' ? 'active' : ''}`}
            onClick={() => setKind('income')}
          >
            Income
          </button>
        </div>

        <label className="txn-label">Amount</label>
        <div className="txn-amount-wrap">
          <span className="txn-amount-symbol">{sym(currency)}</span>
          <input
            type="number"
            className="txn-amount-input"
            value={form.amount}
            onChange={set('amount')}
            placeholder="0.00"
          />
        </div>

        {/* Category options come from `cats`, which tracks the chosen type. */}
        <label className="txn-label">Category</label>
        <select className="txn-select" value={form.category} onChange={set('category')}>
          {cats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <label className="txn-label">Date</label>
        <input type="date" className="txn-input" value={form.date} onChange={set('date')} />

        <label className="txn-label">
          Description <span className="txn-label__optional">(optional)</span>
        </label>
        <input
          className="txn-input txn-input--last"
          value={form.description}
          onChange={set('description')}
          placeholder="e.g. Weekly groceries"
        />

        {/* Validation message, only rendered when there's an error to show. */}
        {error && <div className="txn-error">{error}</div>}

        <div className="txn-footer">
          {/* Delete only makes sense when editing an existing transaction. */}
          {editing && (
            <button className="txn-footer__delete" onClick={() => onDelete(initial.id)}>Delete</button>
          )}
          <button className="txn-footer__cancel" onClick={onClose}>Cancel</button>
          <button className="txn-footer__save"   onClick={save}>Save</button>
        </div>

      </div>
    </div>
  )
}
