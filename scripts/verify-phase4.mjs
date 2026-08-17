#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";
const AI_URL = process.env.AI_URL ?? "http://localhost:5000";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3002";

const SAMPLE_TEXT = `Circular No. 12/2025
Ministry of Education
Deadline: 15/03/2026
All principals must submit reports by 15 March 2026.
Refer to Education Ordinance Section 45.`;

const VERIFY_USER = {
  name: "Phase 4 Verifier",
  email: "phase4-verify@easycircular.local",
  password: "Phase4Verify!test",
  jobRole: "teacher",
  district: "Colombo",
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(ROOT, "ai-service", ".env"));
loadEnvFile(path.join(ROOT, "backend", ".env"));

function aiHeaders(json = true) {
  const headers = json ? { "Content-Type": "application/json" } : {};
  const token = (process.env.AI_SERVICE_TOKEN || "").trim();
  if (token) {
    headers["X-AI-Service-Token"] = token;
  }
  return headers;
}

function bearerHeaders(token, extra = {}) {
  return { Authorization: `Bearer ${token}`, ...extra };
}

async function check(name, fn) {
  try {
    await fn();
    console.log(`OK    ${name}`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL  ${name}`);
    console.error(`       ${message}`);
    return false;
  }
}

async function ensureVerifierToken() {
  const register = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(VERIFY_USER),
  });
  const registered = await register.json().catch(() => ({}));
  if (register.ok && registered.token) {
    return registered.token;
  }

  const login = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: VERIFY_USER.email,
      password: VERIFY_USER.password,
    }),
  });
  const loggedIn = await login.json().catch(() => ({}));
  if (!login.ok || !loggedIn.token) {
    throw new Error(loggedIn.error || registered.error || "Could not sign in verifier");
  }
  return loggedIn.token;
}

function findSamplePdf() {
  const candidates = [
    path.join(ROOT, "docs/sample-circulars/test-digital.pdf"),
    path.join(ROOT, "docs/sample-circulars/10-2026-En.pdf"),
    path.join(ROOT, "sample circulars/10-2026-En.pdf"),
    path.join(ROOT, "sample circulars/15-2026-En.pdf"),
  ];
  return candidates.find((filePath) => fs.existsSync(filePath)) || null;
}

function buildMinimalCircularPdf() {
  const content =
    "BT /F1 12 Tf 72 720 Td (Circular No. 12/2025 Deadline 15/03/2026) Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let body = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(body, "latin1"));
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefStart = Buffer.byteLength(body, "latin1");
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  body += xref;
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(body, "latin1");
}

function loadUploadPdf() {
  const sample = findSamplePdf();
  if (sample) {
    return { bytes: fs.readFileSync(sample), filename: path.basename(sample) };
  }
  return { bytes: buildMinimalCircularPdf(), filename: "minimal-circular.pdf" };
}

const results = [];

results.push(
  await check("AI /health (llm provider info)", async () => {
    const response = await fetch(`${AI_URL}/health`);
    const body = await response.json();
    if (!response.ok || body.status !== "ok") {
      throw new Error("AI health failed");
    }
    if (!("llm_provider" in body)) {
      throw new Error("Missing llm_provider in health response");
    }
  }),
);

results.push(
  await check("AI /pipeline", async () => {
    const response = await fetch(`${AI_URL}/v1/pipeline`, {
      method: "POST",
      headers: aiHeaders(),
      body: JSON.stringify({ text: SAMPLE_TEXT }),
    });
    const body = await response.json();
    if (!response.ok) {
      throw new Error(JSON.stringify(body));
    }
    if (!body.summary?.sections?.length) {
      throw new Error("Pipeline returned no summary sections");
    }
    if (!body.entities?.length) {
      throw new Error("Pipeline returned no entities");
    }
  }),
);

results.push(
  await check("Backend upload requires sign-in (401)", async () => {
    const { bytes, filename } = loadUploadPdf();
    const form = new FormData();
    form.append("file", new Blob([bytes], { type: "application/pdf" }), filename);

    const upload = await fetch(`${BACKEND_URL}/api/circulars/upload`, {
      method: "POST",
      body: form,
    });
    if (upload.status !== 401) {
      throw new Error(`Expected 401, got ${upload.status}`);
    }
  }),
);

results.push(
  await check("Backend MVP flow (upload → extract → process)", async () => {
    const { bytes, filename } = loadUploadPdf();
    const token = await ensureVerifierToken();
    const auth = bearerHeaders(token);

    const form = new FormData();
    form.append("file", new Blob([bytes], { type: "application/pdf" }), filename);

    const upload = await fetch(`${BACKEND_URL}/api/circulars/upload`, {
      method: "POST",
      headers: auth,
      body: form,
    });
    const uploaded = await upload.json();
    if (!upload.ok) {
      throw new Error(uploaded.error || "Upload failed");
    }

    const id = uploaded.circularId;
    const extract = await fetch(`${BACKEND_URL}/api/circulars/${id}/extract`, {
      method: "POST",
      headers: auth,
    });
    if (!extract.ok) {
      const body = await extract.json().catch(() => ({}));
      throw new Error(body.error || "Extract failed");
    }

    const process = await fetch(`${BACKEND_URL}/api/circulars/${id}/process`, {
      method: "POST",
      headers: auth,
    });
    const processed = await process.json();
    if (!process.ok || processed.circular?.status !== "completed") {
      throw new Error(processed.error || "Process failed");
    }
    if (!processed.circular?.summary?.sections?.length) {
      throw new Error("No summary on completed circular");
    }
  }),
);

results.push(
  await check("Frontend", async () => {
    const response = await fetch(FRONTEND_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  }),
);

console.log("");
if (results.every(Boolean)) {
  console.log("Phase 4 exit gate passed (MVP flow + export-ready summary).");
  process.exit(0);
}

console.error("Phase 4 exit gate failed.");
process.exit(1);
