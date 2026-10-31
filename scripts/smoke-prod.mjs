#!/usr/bin/env node
/** Production smoke against Render backend. */
import fs from "node:fs";
import path from "node:path";

const API = process.env.BACKEND_URL ?? "https://easycircular-backend.onrender.com";
const pdfPath =
  process.argv[2] ||
  path.join("docs", "sample-circulars", "test-digital.pdf");

async function timed(label, ms, fn) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fn(ctrl.signal);
  } finally {
    clearTimeout(t);
  }
}

const email = `prod-smoke-${Date.now()}@example.com`;
const reg = await timed("register", 60_000, (signal) =>
  fetch(`${API}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: "SmokeTest123!",
      name: "Prod Smoke",
      jobRole: "teacher",
      district: "Colombo",
    }),
    signal,
  }),
);
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
const up = await timed("upload", 120_000, (signal) =>
  fetch(`${API}/api/circulars/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${regBody.token}` },
    body: fd,
    signal,
  }),
);
const upBody = await up.json();
const id = upBody.circularId || upBody.id || upBody.circular?.id;
if (!id) {
  console.error("upload failed", up.status, upBody);
  process.exit(1);
}
console.log("OK upload", id);

console.log("extracting...");
const ex = await timed("extract", 600_000, (signal) =>
  fetch(`${API}/api/circulars/${id}/extract`, {
    method: "POST",
    headers: { Authorization: `Bearer ${regBody.token}` },
    signal,
  }),
);
const exBody = await ex.json();
const textLen = (exBody.circular?.extractedText || exBody.extractedText || "").length;
console.log("OK extract", ex.status, "textLen=", textLen);
if (!ex.ok || textLen < 20) {
  console.error("extract failed", exBody);
  process.exit(1);
}

console.log("processing...");
const pr = await timed("process", 600_000, (signal) =>
  fetch(`${API}/api/circulars/${id}/process`, {
    method: "POST",
    headers: { Authorization: `Bearer ${regBody.token}` },
    signal,
  }),
);
const prBody = await pr.json();
const circular = prBody.circular || prBody;
const summary = circular.summary;
console.log(
  "OK process",
  pr.status,
  JSON.stringify({
    status: circular.status,
    hasSummary: Boolean(summary),
    entityCount: (circular.entities || []).length,
    preview:
      typeof summary === "string"
        ? summary.slice(0, 120)
        : JSON.stringify(summary)?.slice(0, 120),
  }),
);
if (!summary) {
  console.error("no summary", prBody);
  process.exit(1);
}
console.log("Production smoke passed.");
