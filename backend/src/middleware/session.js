const crypto = require("crypto");

const SESSION_HEADER = "x-session-id";

function normalizeSessionId(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^[a-f0-9-]{36}$/i.test(trimmed)) return null;
  return trimmed;
}

function createSessionId() {
  return crypto.randomUUID();
}

function attachSession(req, _res, next) {
  const fromHeader = normalizeSessionId(req.headers[SESSION_HEADER]);
  req.sessionId = fromHeader || createSessionId();
  req.sessionCreated = !fromHeader;
  next();
}

module.exports = {
  SESSION_HEADER,
  attachSession,
  createSessionId,
  normalizeSessionId,
};
