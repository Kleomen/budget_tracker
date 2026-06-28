const jwt = require('jsonwebtoken');

/* Express middleware that protects routes by requiring a valid JWT.
   The client sends it as "Authorization: Bearer <token>" (handed out by
   /api/auth/login and /api/auth/signup). On success we stash the user's id
   on req.userId so route handlers can scope their queries to that user. */
module.exports = function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing authentication token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
