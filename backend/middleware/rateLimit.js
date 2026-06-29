/* Per-IP fixed-window limiter factory. Each call returns an independent
   middleware with its own counter map, so different route groups can have
   different limits without sharing counts. After `max` requests within
   `windowMs`, the client gets 429 until the window rolls over.

   ponytail: in-memory + single fixed window — fine for one Render instance.
   If the backend ever scales to multiple instances, swap this for
   express-rate-limit backed by a shared store (Redis). Each `attempts` map
   only frees an IP's entry when that IP comes back after its window expired;
   idle entries linger until restart — negligible at this scale. */
module.exports = function rateLimiter(max, windowMs) {
  const attempts = new Map(); // ip -> { count, resetAt }

  return function limit(req, res, next) {
    const ip = req.ip;
    const now = Date.now();
    const rec = attempts.get(ip);

    if (!rec || now > rec.resetAt) {
      attempts.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    rec.count++;
    if (rec.count > max) {
      return res.status(429).json({ error: 'Too many requests, please try again later' });
    }
    next();
  };
};
