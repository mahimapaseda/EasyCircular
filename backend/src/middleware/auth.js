const jwt = require("jsonwebtoken");

const DEV_FALLBACK_SECRET = "dev-secret-change-in-production";
const EXAMPLE_SECRETS = new Set([
  "",
  DEV_FALLBACK_SECRET,
  "change-this-to-a-long-random-string",
]);

function isProduction() {
  return process.env.NODE_ENV === "production";
}

let warnedWeakSecret = false;

function resolveJwtSecret() {
  const secret = (process.env.JWT_SECRET || "").trim();
  const weak = EXAMPLE_SECRETS.has(secret);

  if (isProduction() && weak) {
    throw new Error(
      "JWT_SECRET must be set to a long random string in production (not the example placeholder)",
    );
  }

  if (weak) {
    if (!warnedWeakSecret) {
      warnedWeakSecret = true;
      console.warn(
        "JWT_SECRET is missing or uses the example value. Using a dev-only fallback. Do not deploy with this secret.",
      );
    }
    return DEV_FALLBACK_SECRET;
  }

  return secret;
}

function assertJwtSecret() {
  resolveJwtSecret();
}

function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Sign in required" });
  }

  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, resolveJwtSecret());
    next();
  } catch (error) {
    if (error.message?.includes("JWT_SECRET")) {
      return res.status(500).json({ error: "Server auth is not configured" });
    }
    return res.status(401).json({ error: "Session expired. Sign in again" });
  }
}

function authOptional(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, resolveJwtSecret());
  } catch {
    req.user = null;
  }

  next();
}

module.exports = {
  authRequired,
  authOptional,
  assertJwtSecret,
  resolveJwtSecret,
  DEV_FALLBACK_SECRET,
  get JWT_SECRET() {
    return resolveJwtSecret();
  },
};
