const { test } = require("node:test");
const assert = require("node:assert/strict");
const { canAccess, listFilter } = require("../src/services/circularService");

test("canAccess denies circulars with no owner and no session", () => {
  const circular = { userId: null, sessionId: null };
  assert.equal(canAccess(circular, null, "session-a"), false);
  assert.equal(canAccess(circular, null, null), false);
});

test("canAccess allows the matching guest session only", () => {
  const circular = { userId: null, sessionId: "session-a" };
  assert.equal(canAccess(circular, null, "session-a"), true);
  assert.equal(canAccess(circular, null, "session-b"), false);
});

test("canAccess allows the owning user and denies others", () => {
  const circular = { userId: { toString: () => "user-1" }, sessionId: null };
  assert.equal(canAccess(circular, { id: "user-1" }, "session-a"), true);
  assert.equal(canAccess(circular, { id: "user-2" }, "session-a"), false);
  assert.equal(canAccess(circular, null, "session-a"), false);
});

test("listFilter scopes guests to their session", () => {
  assert.deepEqual(listFilter(null, "session-a"), { userId: null, sessionId: "session-a" });
  assert.deepEqual(listFilter({ id: "user-1" }, "session-a"), { userId: "user-1" });
});
