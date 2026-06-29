require('dotenv').config();
const express = require('express');
const cors = require('cors');

const requireAuth = require('./middleware/auth');
const rateLimiter = require('./middleware/rateLimit');
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const budgetRoutes = require('./routes/budgets');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not set — refusing to start without it');
}

const app = express();
const port = process.env.PORT || 3000;

// Behind Render's proxy, so req.ip reflects the real client (X-Forwarded-For)
// for the auth rate limiter rather than the proxy's address.
app.set('trust proxy', 1);

// Restrict to the deployed frontend's origin. Unset (local dev) reflects the
// request origin so the Vite dev server just works; set FRONTEND_ORIGIN in prod.
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || true }));
app.use(express.json());

// Strict per-IP limiter for auth (brute-force defense); looser one for the
// authenticated data endpoints so a single token can't hammer the DB.
const authLimiter = rateLimiter(10, 15 * 60 * 1000);   // 10 / 15 min
const apiLimiter = rateLimiter(300, 15 * 60 * 1000);   // 300 / 15 min

// Simple health check (no auth) so you can verify the server is up.
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Public auth endpoints: signup + login hand out JWTs. Rate-limited per IP.
app.use('/api/auth', authLimiter, authRoutes);

// Everything below requires a valid "Authorization: Bearer <token>" header
// and is scoped to the authenticated user.
app.use('/api/transactions', apiLimiter, requireAuth, transactionRoutes);
app.use('/api/budgets', apiLimiter, requireAuth, budgetRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
