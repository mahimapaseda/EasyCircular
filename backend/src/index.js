require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const circularRoutes = require("./routes/circulars");
const { attachSession } = require("./middleware/session");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const { securityHeaders, requestLogger } = require("./middleware/security");
const { healthCheck } = require("./services/aiClient");

const PORT = Number(process.env.PORT) || 4000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/easycircular";
const CORS_ORIGINS = process.env.CORS_ORIGINS;

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(securityHeaders);
app.use(requestLogger);
app.use(
  cors({
    origin: CORS_ORIGINS ? CORS_ORIGINS.split(",").map((o) => o.trim()) : true,
    exposedHeaders: ["X-Session-Id", "X-Request-Id"],
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(attachSession);

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

async function connectMongo() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
}

app.use("/api/auth", authRoutes);
app.use("/api/circulars", circularRoutes);

app.get("/health", async (_req, res) => {
  const checks = {
    service: "backend",
    status: "ok",
    timestamp: new Date().toISOString(),
    mongodb: "unknown",
    aiService: "unknown",
    apiVersion: "v1",
  };

  try {
    const mongoState = mongoose.connection.readyState;
    checks.mongodb =
      mongoState === 1 ? "connected" : `disconnected (${mongoState})`;

    if (mongoState !== 1) {
      checks.status = "degraded";
    }
  } catch {
    checks.mongodb = "error";
    checks.status = "degraded";
  }

  try {
    const aiResponse = await healthCheck();
    checks.aiService = aiResponse?.status === "ok" ? "ok" : "degraded";
    checks.llmProvider = aiResponse?.llm_provider || null;
    checks.llmModel = aiResponse?.llm_model || null;
    checks.llmConfigured = Boolean(aiResponse?.llm_configured);
    checks.ollamaReachable =
      typeof aiResponse?.ollama_reachable === "boolean"
        ? aiResponse.ollama_reachable
        : null;
    checks.ollamaModelReady =
      typeof aiResponse?.ollama_model_ready === "boolean"
        ? aiResponse.ollama_model_ready
        : null;
    if (checks.aiService !== "ok") {
      checks.status = "degraded";
    }
  } catch {
    checks.aiService = "unreachable";
    checks.llmProvider = null;
    checks.llmModel = null;
    checks.llmConfigured = false;
    checks.ollamaReachable = null;
    checks.ollamaModelReady = null;
    checks.status = "degraded";
  }

  const httpStatus = checks.status === "ok" ? 200 : 503;
  res.status(httpStatus).json(checks);
});

app.get("/", (_req, res) => {
  res.json({
    name: "EasyCircular API",
    version: "0.2.0",
    apiVersion: "v1",
    health: "/health",
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  try {
    await connectMongo();
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
  }

  const server = app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
  });

  async function shutdown(signal) {
    console.log(`\n${signal} received — shutting down gracefully`);
    server.close(() => console.log("HTTP server closed"));
    try {
      await mongoose.connection.close();
      console.log("MongoDB connection closed");
    } catch (error) {
      console.error("Error closing MongoDB:", error.message);
    } finally {
      process.exit(0);
    }
  }

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

start();
