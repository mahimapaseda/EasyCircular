require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const circularRoutes = require("./routes/circulars");
const { attachSession } = require("./middleware/session");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const { healthCheck } = require("./services/aiClient");

const PORT = Number(process.env.PORT) || 4000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/easycircular";

const app = express();

app.use(cors({ exposedHeaders: ["X-Session-Id"] }));
app.use(express.json());
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
    if (checks.aiService !== "ok") {
      checks.status = "degraded";
    }
  } catch {
    checks.aiService = "unreachable";
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

  app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
  });
}

start();
