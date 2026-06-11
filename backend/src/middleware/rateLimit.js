const buckets = new Map();

function rateLimit({ windowMs = 60_000, max = 30, keyPrefix = "rl" } = {}) {
  return (req, res, next) => {
    const identity =
      req.user?.id ||
      req.sessionId ||
      req.ip ||
      req.socket?.remoteAddress ||
      "anonymous";
    const key = `${keyPrefix}:${identity}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now > bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (bucket.count >= max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({
        error: "Too many requests. Please wait and try again.",
        retryAfter,
      });
    }

    bucket.count += 1;
    return next();
  };
}

module.exports = { rateLimit };
