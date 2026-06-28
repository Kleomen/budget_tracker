const express = require('express');
const pool = require('../db');

const router = express.Router();

/* Budgets are stored per category per month. The frontend treats them as a flat
   { category: limit } map for the current month, so everything here targets
   date_trunc('month', CURRENT_DATE).
   ponytail: no month param — add it back when a month picker actually ships. */

/* Read every budget row for the user (current month) into a { category: limit } map. */
const fetchBudgetMap = async (client, userId) => {
  const result = await client.query(
    `SELECT category, amount_limit::float AS limit
     FROM budgets
     WHERE user_id = $1 AND month = date_trunc('month', CURRENT_DATE)::date`,
    [userId]
  );
  return result.rows.reduce((map, row) => {
    map[row.category] = row.limit;
    return map;
  }, {});
};

/* GET /api/budgets — the user's budget limits as a { category: limit } map. */
router.get('/', async (req, res) => {
  try {
    const map = await fetchBudgetMap(pool, req.userId);
    res.json(map);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

/* PUT /api/budgets — set the user's budget limits for the current month.
   Body: { budgets: { category: limit, ... } }
   A positive limit is upserted; a zero/blank limit clears that category.
   Responds with the resulting { category: limit } map. */
router.put('/', async (req, res) => {
  const budgets = (req.body || {}).budgets;
  if (!budgets || typeof budgets !== 'object' || Array.isArray(budgets)) {
    return res.status(400).json({ error: 'budgets must be an object of { category: limit }' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [category, raw] of Object.entries(budgets)) {
      const limit = Number(raw);
      if (Number.isFinite(limit) && limit > 0) {
        await client.query(
          `INSERT INTO budgets (user_id, category, amount_limit, month)
           VALUES ($1, $2, $3, date_trunc('month', CURRENT_DATE)::date)
           ON CONFLICT (user_id, category, month)
           DO UPDATE SET amount_limit = EXCLUDED.amount_limit`,
          [req.userId, category, limit]
        );
      } else {
        // Non-positive / blank limit means "no budget for this category".
        await client.query(
          `DELETE FROM budgets
           WHERE user_id = $1 AND category = $2
             AND month = date_trunc('month', CURRENT_DATE)::date`,
          [req.userId, category]
        );
      }
    }
    const map = await fetchBudgetMap(client, req.userId);
    await client.query('COMMIT');
    res.json(map);
  } catch (err) {
    await client.query('ROLLBACK');
    // 23514 = check_violation (e.g. a category outside the allowed set)
    if (err.code === '23514') {
      return res.status(400).json({ error: 'One or more categories or limits are not allowed' });
    }
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
