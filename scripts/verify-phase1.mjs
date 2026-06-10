#!/usr/bin/env node

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";
const AI_URL = process.env.AI_URL ?? "http://localhost:5000";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3002";

async function check(name, url, validate) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const isJson = response.headers.get("content-type")?.includes("json");
    const body = isJson ? await response.json() : null;

    if (!validate(response, body)) {
      console.error(`FAIL  ${name} (${url})`);
      if (body) {
        console.error(`       ${JSON.stringify(body)}`);
      } else {
        console.error(`       HTTP ${response.status}`);
      }
      return false;
    }

    console.log(`OK    ${name}`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL  ${name} (${url})`);
    console.error(`       ${message}`);
    return false;
  }
}

const results = await Promise.all([
  check("AI service /health", `${AI_URL}/health`, (response, body) => {
    return response.ok && body?.service === "ai-service" && body?.status === "ok";
  }),
  check("Backend /health", `${BACKEND_URL}/health`, (response, body) => {
    return (
      response.ok &&
      body?.service === "backend" &&
      body?.status === "ok" &&
      body?.mongodb === "connected" &&
      body?.aiService === "ok"
    );
  }),
  check("Frontend", FRONTEND_URL, (response) => response.ok),
]);

console.log("");

if (results.every(Boolean)) {
  console.log("Phase 1 exit gate passed (all services healthy).");
  process.exit(0);
}

console.error("Phase 1 exit gate failed.");
console.error("");
console.error("Start services with either:");
console.error("  docker compose up --build");
console.error("  or follow README.md local development steps, then re-run:");
console.error("  node scripts/verify-phase1.mjs");
process.exit(1);
