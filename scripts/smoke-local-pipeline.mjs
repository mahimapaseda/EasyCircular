#!/usr/bin/env node
/**
 * Local smoke: register → upload → extract → process against running stack.
 * Usage: node scripts/smoke-local-pipeline.mjs [path/to.pdf]
 */
import fs from "node:fs";
import path from "node:path";

const API = process.env.BACKEND_URL ?? "http://127.0.0.1:4000";
const pdfPath =
  process.argv[2] ||
  path.join("docs", "sample-circulars", "test-digital.pdf");

const email = `deploy-smoke-${Date.now()}@example.com`;

const reg = await fetch(`${API}/api/auth/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email,
    password: "SmokeTest123!",
    name: "Smoke Tester",
    jobRole: "teacher",
    district: "Colombo",
  }),
});
const regBody = await reg.json();
if (!regBody.token) {
  console.error("register failed", reg.status, regBody);
  process.exit(1);
}
console.log("OK register");

const pdf = fs.readFileSync(pdfPath);
const blob = new Blob([pdf], { type: "application/pdf" });
const fd = new FormData();
fd.append("file", blob, path.basename(pdfPath));
const up = await fetch(`${API}/api/circulars/upload`, {
  method: "POST",
  headers: { Authorization: `Bearer ${regBody.token}` },
  body: fd,
});
const upBody = await up.json();
const id = upBody.circularId || upBody.id || upBody.circular?.id;
if (!id) {
  console.error("upload failed", up.status, upBody);
  process.exit(1);
}
console.log("OK upload", id);

const ex = await fetch(`${API}/api/circulars/${id}/extract`, {
  method: "POST",
  headers: { Authorization: `Bearer ${regBody.token}` },
});
const exBody = await ex.json();
const textLen = (exBody.circular?.extractedText || exBody.extractedText || "").length;
console.log("OK extract", ex.status, "textLen=", textLen);

const pr = await fetch(`${API}/api/circulars/${id}/process`, {
  method: "POST",
  headers: { Authorization: `Bearer ${regBody.token}` },
});
const prBody = await pr.json();
const circular = prBody.circular || prBody;
const summary = circular.summary;
const entities = circular.entities || [];
console.log(
  "OK process",
  pr.status,
  JSON.stringify({
    status: circular.status,
    hasSummary: Boolean(summary),
    entityCount: entities.length,
    summaryPreview:
      typeof summary === "string"
        ? summary.slice(0, 160)
        : JSON.stringify(summary)?.slice(0, 160),
  }),
);

if (!summary) {
  console.error("FAIL: no summary produced");
  process.exit(1);
}
console.log("Smoke pipeline passed.");
