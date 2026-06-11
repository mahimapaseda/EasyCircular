const axios = require("axios");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:5000";

const client = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 180_000,
  headers: { "Content-Type": "application/json" },
});

async function parsePdf(base64, filename) {
  const { data } = await client.post("/v1/parse/pdf", { base64, filename });
  return data;
}

async function runPipeline(text) {
  const { data } = await client.post("/v1/pipeline", { text });
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
