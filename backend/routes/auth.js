const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { sendVerificationEmail } = require('../mailer');

const router = express.Router();

/* How long a login stays valid before the user has to sign in again. */
const TOKEN_TTL = '7d';

/* Sign a JWT carrying the user's id. */
const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: TOKEN_TTL });

/* A short-lived token used only to confirm ownership of an email address.
   `purpose` distinguishes it from a login token signed with the same secret. */
const signVerifyToken = (userId) =>
  jwt.sign({ userId, purpose: 'verify' }, process.env.JWT_SECRET, { expiresIn: '24h' });

/* Where the frontend lives, so the emailed link lands on a real page that then
   POSTs the token back to /verify. Falls back to the Vite dev server locally. */
const verifyLink = (userId) =>
  `${process.env.FRONTEND_ORIGIN || 'http://localhost:5173'}/verify?token=${signVerifyToken(userId)}`;

/* Field checks — must mirror frontend/src/validators.js. ponytail: duplicated
   (separate package, ~6 lines) instead of a shared module; keep them in sync. */
const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
const passwordProblem = (pw) => {
  if (pw.length < 8) return 'Password must be at least 8 characters';
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(pw)).length;
  if (classes < 3) return 'Use at least 3 of: lowercase, uppercase, number, symbol';
  return null;
};

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
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }
  const pwProblem = passwordProblem(password);
  if (pwProblem) {
    return res.status(400).json({ error: pwProblem });
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

    // Email the verification link. If sending fails we don't fail the signup —
    // the account exists and the user can request a fresh link via /resend.
    try {
      await sendVerificationEmail(user.email, verifyLink(user.user_id));
    } catch (mailErr) {
      console.error('Failed to send verification email:', mailErr.message);
    }

    // No login token yet — the user must verify before they can sign in.
    res.status(201).json({
      message: 'Account created. Check your email for a link to verify your address before signing in.',
      email: user.email,
    });
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
      `SELECT user_id, username, email, name, password_hash, email_verified FROM users WHERE email = $1`,
      [email.trim()]
    );

    const user = result.rows[0];
    // Same generic message whether the email is unknown or the password is wrong,
    // so we don't leak which emails have accounts.
    const ok = user && (await bcrypt.compare(password, user.password_hash));
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Password is right but the address was never confirmed — block until they do.
    if (!user.email_verified) {
      return res.status(403).json({
        error: 'Please verify your email before signing in. Check your inbox or request a new link.',
        needsVerification: true,
      });
    }

    res.json({ token: signToken(user.user_id), user: publicUser(user) });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

/* POST /api/auth/verify — confirm an email from the link's token.
   Body: { token }. On success marks the account verified and returns a normal
   login token so the user is signed straight in. */
router.post('/verify', async (req, res) => {
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: 'Verification token is required' });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(400).json({ error: 'This verification link is invalid or has expired' });
  }
  if (payload.purpose !== 'verify') {
    return res.status(400).json({ error: 'This verification link is invalid' });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET email_verified = true WHERE user_id = $1
       RETURNING user_id, username, email, name`,
      [payload.userId]
    );
    if (result.rowCount === 0) return res.status(400).json({ error: 'Account not found' });

    const user = result.rows[0];
    res.json({ token: signToken(user.user_id), user: publicUser(user) });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

/* POST /api/auth/resend — send a fresh verification link.
   Body: { email }. Always returns the same message regardless of whether the
   account exists or is already verified, so it can't be used to probe emails. */
router.post('/resend', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email is required' });

  const generic = { message: 'If that account exists and is unverified, a new verification link has been sent.' };

  try {
    const result = await pool.query(
      `SELECT user_id, email, email_verified FROM users WHERE email = $1`,
      [email.trim()]
    );
    const user = result.rows[0];
    if (user && !user.email_verified) {
      await sendVerificationEmail(user.email, verifyLink(user.user_id));
    }
    res.json(generic);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
