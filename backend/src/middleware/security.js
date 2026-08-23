const crypto = require("crypto");

function securityHeaders(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()",
  );
  res.removeHeader("X-Powered-By");
  next();
}

function requestLogger(req, res, next) {
  const requestId = crypto.randomUUID();
  req.id = requestId;
  res.setHeader("X-Request-Id", requestId);

  if (req.path === "/health") {
    return next();
  }

  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const line = `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(1)}ms`;
    if (res.statusCode >= 500) {
      console.error(`[${requestId}] ${line}`);
    } else {
      console.log(`[${requestId}] ${line}`);
    }
  });

  next();
}

module.exports = { securityHeaders, requestLogger };
