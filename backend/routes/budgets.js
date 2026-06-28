const express = require('express');
const pool = require('../db');

const router = express.Router();

/* Budgets are stored per category per month. The frontend treats them as a
   flat { category: limit } map for "the current month", so these endpoints
   default to the first day of the current month and accept an optional
   ?month=YYYY-MM (GET) / { month } (PUT) to target a specific month. */

/* Turn a "YYYY-MM" string into a "YYYY-MM-01" date, or fall back to the first
   of the current month when none is given. Returns null for a malformed value. */
const monthToDate = (month) => {
  if (!month) return null; // caller substitutes CURRENT_DATE-based default in SQL
  if (!/^\d{4}-\d{2}$/.test(month)) return undefined; // signals "invalid"
  return `${month}-01`;
};

/* Read every budget row for the user/month and fold it into a { category: limit } map. */
const fetchBudgetMap = async (client, userId, monthDate) => {
  const result = await client.query(
    `SELECT category, amount_limit::float AS limit
     FROM budgets
     WHERE user_id = $1
       AND month = COALESCE($2::date, date_trunc('month', CURRENT_DATE)::date)`,
    [userId, monthDate]
  );
  return result.rows.reduce((map, row) => {
    map[row.category] = row.limit;
    return map;
  }, {});
};

/* GET /api/budgets?month=YYYY-MM — the user's budget limits as a { category: limit } map. */
router.get('/', async (req, res) => {
  const monthDate = monthToDate(req.query.month);
  if (monthDate === undefined) return res.status(400).json({ error: 'month must be in YYYY-MM format' });

  try {
    const map = await fetchBudgetMap(pool, req.userId, monthDate);
    res.json(map);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

/* PUT /api/budgets — set the user's budget limits for a month.
   Body: { budgets: { category: limit, ... }, month?: "YYYY-MM" }
   A positive limit is upserted; a zero/blank limit clears that category.
   Responds with the resulting { category: limit } map. */
router.put('/', async (req, res) => {
  const body = req.body || {};
  const budgets = body.budgets;
  const monthDate = monthToDate(body.month);
  if (monthDate === undefined) return res.status(400).json({ error: 'month must be in YYYY-MM format' });
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
           VALUES ($1, $2, $3, COALESCE($4::date, date_trunc('month', CURRENT_DATE)::date))
           ON CONFLICT (user_id, category, month)
           DO UPDATE SET amount_limit = EXCLUDED.amount_limit`,
          [req.userId, category, limit, monthDate]
        );
      } else {
        // Non-positive / blank limit means "no budget for this category".
        await client.query(
          `DELETE FROM budgets
           WHERE user_id = $1 AND category = $2
             AND month = COALESCE($3::date, date_trunc('month', CURRENT_DATE)::date)`,
          [req.userId, category, monthDate]
        );
      }
    }
    const map = await fetchBudgetMap(client, req.userId, monthDate);
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
