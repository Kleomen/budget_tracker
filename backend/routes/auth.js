const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

/* How long a login stays valid before the user has to sign in again. */
const TOKEN_TTL = '7d';

/* Sign a JWT carrying the user's id. */
const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: TOKEN_TTL });

/* Shape the row we send back to the client — never expose password_hash. */
const publicUser = (row) => ({
  id: row.user_id,
  name: row.name,
  email: row.email,
  username: row.username,
});

/* POST /api/auth/signup — create an account and return an auth token.
   Body: { name, email, password, username? }
   username is optional; we fall back to the local part of the email. */
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body || {};
  const username = (req.body?.username || (email ? email.split('@')[0] : '')).trim();

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, name)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, username, email, name`,
      [username, email.trim(), password_hash, name.trim()]
    );

    const user = result.rows[0];
    res.status(201).json({ token: signToken(user.user_id), user: publicUser(user) });
  } catch (err) {
    // 23505 = unique_violation (email or username already taken)
    if (err.code === '23505') {
      return res.status(409).json({ error: 'An account with that email or username already exists' });
    }
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

/* POST /api/auth/login — verify credentials and return an auth token.
   Body: { email, password } */
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const result = await pool.query(
      `SELECT user_id, username, email, name, password_hash FROM users WHERE email = $1`,
      [email.trim()]
    );

    const user = result.rows[0];
    // Same generic message whether the email is unknown or the password is wrong,
    // so we don't leak which emails have accounts.
    const ok = user && (await bcrypt.compare(password, user.password_hash));
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({ token: signToken(user.user_id), user: publicUser(user) });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
