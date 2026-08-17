const { test } = require("node:test");
const assert = require("node:assert/strict");
const { resolveJwtSecret, authRequired, DEV_FALLBACK_SECRET } = require("../src/middleware/auth");

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("dev fallback is used when JWT_SECRET is the example placeholder", () => {
  const previousEnv = process.env.NODE_ENV;
  const previousSecret = process.env.JWT_SECRET;
  process.env.NODE_ENV = "development";
  process.env.JWT_SECRET = "change-this-to-a-long-random-string";
  try {
    assert.equal(resolveJwtSecret(), DEV_FALLBACK_SECRET);
  } finally {
    process.env.NODE_ENV = previousEnv;
    if (previousSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = previousSecret;
    }
  }
});

test("production refuses a missing or example JWT_SECRET", () => {
  const previousEnv = process.env.NODE_ENV;
  const previousSecret = process.env.JWT_SECRET;
  process.env.NODE_ENV = "production";
  process.env.JWT_SECRET = "change-this-to-a-long-random-string";
  try {
    assert.throws(() => resolveJwtSecret(), /JWT_SECRET must be set/);
  } finally {
    process.env.NODE_ENV = previousEnv;
    if (previousSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = previousSecret;
    }
  }
});

test("authRequired returns 401 without a Bearer token", () => {
  const req = { headers: {} };
  const res = mockRes();
  let nextCalled = false;
  authRequired(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, "Sign in required");
});
