/* Per-IP fixed-window limiter for the auth endpoints, to blunt brute-force
   login/signup attempts. Counts every request to the mounted routes; after
   MAX_ATTEMPTS within WINDOW_MS the client gets 429 until the window rolls over.

   ponytail: in-memory + single fixed window — fine for one Render instance.
   If the backend ever scales to multiple instances, swap this for
   express-rate-limit backed by a shared store (Redis). The `attempts` map also
   only frees an IP's entry when that IP comes back after its window expired;
   idle entries linger until restart — negligible at this scale. */
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

const attempts = new Map(); // ip -> { count, resetAt }

module.exports = function authLimiter(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const rec = attempts.get(ip);

  if (!rec || now > rec.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  rec.count++;
  if (rec.count > MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'Too many attempts, please try again later' });
  }
  next();
};
