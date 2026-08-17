const axios = require("axios");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:5000";
const AI_SERVICE_TOKEN = (process.env.AI_SERVICE_TOKEN || "").trim();

const client = axios.create({
  baseURL: AI_SERVICE_URL,
  headers: {
    "Content-Type": "application/json",
    ...(AI_SERVICE_TOKEN ? { "X-AI-Service-Token": AI_SERVICE_TOKEN } : {}),
  },
});

const PARSE_TIMEOUT_MS = Number(process.env.AI_PARSE_TIMEOUT_MS || 600_000);
const PIPELINE_TIMEOUT_MS = Number(process.env.AI_PIPELINE_TIMEOUT_MS || 300_000);

async function parsePdf(base64, filename) {
  const { data } = await client.post(
    "/v1/parse/pdf",
    { base64, filename },
    { timeout: PARSE_TIMEOUT_MS },
  );
  return data;
}

async function runPipeline(text, filename) {
  const { data } = await client.post(
    "/v1/pipeline",
    { text, filename: filename || undefined },
    { timeout: PIPELINE_TIMEOUT_MS },
  );
  return data;
}

async function healthCheck() {
  const { data } = await client.get("/health", { timeout: 3000 });
  return data;
}

module.exports = {
  parsePdf,
  runPipeline,
  healthCheck,
  AI_SERVICE_URL,
};
