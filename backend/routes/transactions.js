const express = require('express');
const pool = require('../db');

const router = express.Router();

/* Columns selected for every transaction response, aliased to match the
   shape the frontend uses ({ id, date, ... }). transaction_date is formatted
   as text so it's always "YYYY-MM-DD" regardless of server timezone, and the
   numeric amount is cast to a JS number rather than a string. */
const SELECT_COLS = `
  transaction_id AS id,
  type,
  category,
  amount::float AS amount,
  to_char(transaction_date, 'YYYY-MM-DD') AS date,
  description`;

/* Validate the body of a create/update. Returns an error string, or null if ok. */
const validate = ({ type, category, amount, date }) => {
  if (type !== 'income' && type !== 'expense') return "type must be 'income' or 'expense'";
  if (!category) return 'category is required';
  if (amount == null || isNaN(Number(amount)) || Number(amount) <= 0) return 'amount must be a positive number';
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'date must be in YYYY-MM-DD format';
  return null;
};

/* GET /api/transactions — all of the signed-in user's transactions, newest first. */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${SELECT_COLS} FROM transactions
       WHERE user_id = $1
       ORDER BY transaction_date DESC, transaction_id DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

/* POST /api/transactions — create a transaction.
   Body: { type, category, amount, date, description? } */
router.post('/', async (req, res) => {
  const { type, category, amount, date, description } = req.body || {};
  const problem = validate(req.body || {});
  if (problem) return res.status(400).json({ error: problem });

  try {
    const result = await pool.query(
      `INSERT INTO transactions (user_id, type, category, amount, transaction_date, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${SELECT_COLS}`,
      [req.userId, type, category, amount, date, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    // 23514 = check_violation (e.g. a category outside the allowed set)
    if (err.code === '23514') return res.status(400).json({ error: 'Invalid category for this transaction' });
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

/* PUT /api/transactions/:id — update one of the user's transactions.
   Body: { type, category, amount, date, description? } */
router.put('/:id', async (req, res) => {
  const { type, category, amount, date, description } = req.body || {};
  const problem = validate(req.body || {});
  if (problem) return res.status(400).json({ error: problem });

  try {
    const result = await pool.query(
      `UPDATE transactions
       SET type = $1, category = $2, amount = $3, transaction_date = $4, description = $5
       WHERE transaction_id = $6 AND user_id = $7
       RETURNING ${SELECT_COLS}`,
      [type, category, amount, date, description || null, req.params.id, req.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Transaction not found' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23514') return res.status(400).json({ error: 'Invalid category for this transaction' });
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

/* DELETE /api/transactions/:id — remove one of the user's transactions. */
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM transactions WHERE transaction_id = $1 AND user_id = $2`,
      [req.params.id, req.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Transaction not found' });
    res.status(204).end();
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
