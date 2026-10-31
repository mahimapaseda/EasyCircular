#!/usr/bin/env node
/**
 * Production e2e when OCR OOMs on Render free/standard:
 * upload PDF → seed extractedText in Mongo → process (NVIDIA).
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "backend", "package.json"),
);
const mongoose = require("mongoose");

const API = process.env.BACKEND_URL ?? "https://easycircular-backend.onrender.com";
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI required");
  process.exit(1);
}

const pdfPath =
  process.argv[2] || path.join("docs", "sample-circulars", "test-digital.pdf");

const email = `e2e-${Date.now()}@example.com`;
const reg = await (
  await fetch(`${API}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: "SmokeTest123!",
      name: "E2E",
      jobRole: "teacher",
      district: "Colombo",
    }),
  })
).json();
if (!reg.token) {
  console.error("register failed", reg);
  process.exit(1);
}
console.log("OK register");

const pdf = fs.readFileSync(pdfPath);
const fd = new FormData();
fd.append("file", new Blob([pdf], { type: "application/pdf" }), path.basename(pdfPath));
const up = await (
  await fetch(`${API}/api/circulars/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${reg.token}` },
    body: fd,
  })
).json();
const id = up.circularId;
if (!id) {
  console.error("upload failed", up);
  process.exit(1);
}
console.log("OK upload", id);

const text =
  "Circular No. 03/2014 dated 12 January 2014 issued by the Ministry of Education. " +
  "Schools must report dengue cases weekly to the Zonal Education Office. " +
  "Effective immediately for all schools.";

await mongoose.connect(uri);
const r = await mongoose.connection.db.collection("circulars").updateOne(
  { _id: new mongoose.Types.ObjectId(id) },
  { $set: { extractedText: text, status: "extracted", contentHash: `e2e-${Date.now()}` } },
);
console.log("OK seed text matched", r.matchedCount);
await mongoose.disconnect();

const pr = await fetch(`${API}/api/circulars/${id}/process`, {
  method: "POST",
  headers: { Authorization: `Bearer ${reg.token}` },
});
const body = await pr.json();
const c = body.circular || body;
console.log(
  "OK process",
  pr.status,
  JSON.stringify({
    status: c.status,
    hasSummary: Boolean(c.summary),
    entities: (c.entities || []).length,
    preview: JSON.stringify(c.summary)?.slice(0, 200),
  }),
);
if (!c.summary) {
  console.error(body);
  process.exit(1);
}
console.log("Production e2e passed (NVIDIA on Render).");
