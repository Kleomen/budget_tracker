require('dotenv').config();
const express = require('express');
const cors = require('cors');

const requireAuth = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const budgetRoutes = require('./routes/budgets');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Simple health check (no auth) so you can verify the server is up.
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Public auth endpoints: signup + login hand out JWTs.
app.use('/api/auth', authRoutes);

// Everything below requires a valid "Authorization: Bearer <token>" header
// and is scoped to the authenticated user.
app.use('/api/transactions', requireAuth, transactionRoutes);
app.use('/api/budgets', requireAuth, budgetRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
