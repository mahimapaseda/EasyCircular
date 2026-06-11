#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";
const AI_URL = process.env.AI_URL ?? "http://localhost:5000";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3002";

const SAMPLE_TEXT = `Circular No. 12/2025
Ministry of Education
Deadline: 15/03/2026
All principals must submit reports by 15 March 2026.
Refer to Education Ordinance Section 45.`;

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
      headers: { "Content-Type": "application/json" },
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
  await check("Backend MVP flow (upload → extract → process)", async () => {
    const pdfPath = path.resolve("docs/sample-circulars/test-digital.pdf");
    if (!fs.existsSync(pdfPath)) {
      throw new Error("Missing docs/sample-circulars/test-digital.pdf");
    }

    const form = new FormData();
    form.append(
      "file",
      new Blob([fs.readFileSync(pdfPath)], { type: "application/pdf" }),
      "test-digital.pdf",
    );

    const upload = await fetch(`${BACKEND_URL}/api/circulars/upload`, {
      method: "POST",
      body: form,
    });
    const uploaded = await upload.json();
    if (!upload.ok) {
      throw new Error(uploaded.error || "Upload failed");
    }

    const id = uploaded.circularId;
    const extract = await fetch(`${BACKEND_URL}/api/circulars/${id}/extract`, {
      method: "POST",
    });
    if (!extract.ok) {
      throw new Error("Extract failed");
    }

    const process = await fetch(`${BACKEND_URL}/api/circulars/${id}/process`, {
      method: "POST",
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
