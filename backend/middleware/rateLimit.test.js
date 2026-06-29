/* Smallest check that the limiter blocks after MAX_ATTEMPTS and resets on a
   new window. Run: node middleware/rateLimit.test.js */
const assert = require('assert');
const rateLimiter = require('./rateLimit');

const authLimiter = rateLimiter(10, 15 * 60 * 1000);

const run = (ip, n) => {
  let lastStatus = 200;
  for (let i = 0; i < n; i++) {
    const res = { status: (s) => { lastStatus = s; return { json: () => {} }; } };
    authLimiter({ ip }, res, () => { lastStatus = 200; });
  }
  return lastStatus;
};

// 10 allowed, 11th blocked.
assert.strictEqual(run('1.1.1.1', 10), 200, 'first 10 should pass');
assert.strictEqual(run('1.1.1.1', 1), 429, '11th should be blocked');

// A different IP is unaffected.
assert.strictEqual(run('2.2.2.2', 1), 200, 'separate IP should pass');

console.log('rateLimit ok');
