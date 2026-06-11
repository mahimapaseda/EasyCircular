const fs = require("fs");
const crypto = require("crypto");
const Circular = require("../models/Circular");
const { parsePdf, runPipeline } = require("./aiClient");

function hashText(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function workingText(circular) {
  return (circular.editedText || circular.extractedText || "").trim();
}

function serializeCircular(doc) {
  return {
    id: doc._id.toString(),
    originalFilename: doc.originalFilename,
    status: doc.status,
    extractedText: doc.extractedText,
    editedText: doc.editedText,
    contentHash: doc.contentHash,
    entities: doc.entities || [],
    summary: doc.summary || null,
    processingMeta: doc.processingMeta,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function canAccess(circular, user, sessionId) {
  if (user?.id) {
    return (
      circular.userId != null && circular.userId.toString() === user.id
    );
  }
  if (circular.userId) return false;
  if (!circular.sessionId) return true;
  return circular.sessionId === sessionId;
}

function listFilter(user, sessionId) {
  if (user?.id) {
    return { userId: user.id };
  }
  return { userId: null, sessionId };
}

async function createFromUpload({ file, user, sessionId }) {
  return Circular.create({
    userId: user?.id || null,
    sessionId: user?.id ? null : sessionId,
    originalFilename: file.originalname,
    filePath: file.path,
    status: "uploaded",
  });
}

async function extractText(circular) {
  if (!fs.existsSync(circular.filePath)) {
    circular.status = "failed";
    circular.processingMeta.extractionError = "PDF file missing on server";
    await circular.save();
    const error = new Error("PDF file missing on server");
    error.status = 410;
    throw error;
  }

  const base64 = fs.readFileSync(circular.filePath).toString("base64");
  let aiResult;

  try {
    aiResult = await parsePdf(base64, circular.originalFilename);
  } catch (error) {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.error ||
      error.message ||
      "AI service unreachable";

    circular.status = "failed";
    circular.processingMeta.extractionError = String(message);
    await circular.save();

    const wrapped = new Error(String(message));
    wrapped.status = 502;
    throw wrapped;
  }

  const extractedText = (aiResult.text || "").trim();
  const pageCount = aiResult.pages || 0;
  const ocrUsed = Boolean(aiResult.ocrUsed);
  const ocrLang = aiResult.ocrLang || null;
  const extractionError = aiResult.error || null;

  if (!extractedText) {
    circular.status = "failed";
    circular.extractedText = "";
    circular.processingMeta = {
      ocrUsed,
      ocrLang,
      pageCount,
      extractionError:
        extractionError ||
        "No readable text found. The PDF may be empty, corrupt, or image-only without OCR.",
    };
    await circular.save();

    const error = new Error(circular.processingMeta.extractionError);
    error.status = 422;
    error.circular = serializeCircular(circular);
    throw error;
  }

  circular.extractedText = extractedText;
  circular.contentHash = hashText(extractedText);
  circular.status = "extracted";
  circular.processingMeta = {
    ocrUsed,
    ocrLang,
    pageCount,
    extractionError,
  };
  await circular.save();
  return circular;
}

async function saveEditedText(circular, text) {
  if (circular.status === "uploaded") {
    const error = new Error("Extract text from the PDF before saving edits");
    error.status = 400;
    throw error;
  }

  const trimmed = text.trim();
  circular.editedText = trimmed;
  circular.contentHash = hashText(trimmed || circular.extractedText);
  if (circular.status !== "completed" && circular.status !== "processing") {
    circular.status = "extracted";
  }
  await circular.save();
  return circular;
}

async function findCachedSummary(contentHash, excludeId) {
  return Circular.findOne({
    contentHash,
    status: "completed",
    _id: { $ne: excludeId },
    summary: { $ne: null },
  }).sort({ updatedAt: -1 });
}

async function processCircular(circular) {
  const text = workingText(circular);
  if (!text) {
    const error = new Error("Extract and review text before running AI processing");
    error.status = 400;
    throw error;
  }

  if (circular.status === "uploaded") {
    const error = new Error("Extract text from the PDF before processing");
    error.status = 400;
    throw error;
  }

  const contentHash = hashText(text);
  circular.contentHash = contentHash;

  const cached = await findCachedSummary(contentHash, circular._id);
  if (cached?.summary?.sections?.length) {
    circular.entities = cached.entities;
    circular.summary = cached.summary;
    circular.status = "completed";
    circular.processingMeta = {
      ...toPlainMeta(circular.processingMeta),
      model: cached.processingMeta?.model || "cache",
      tokensUsed: 0,
      durationMs: 0,
      cached: true,
      guardrailWarnings: cached.processingMeta?.guardrailWarnings || [],
    };
    await circular.save();
    return { circular, cached: true, guardrailWarnings: circular.processingMeta.guardrailWarnings };
  }

  circular.status = "processing";
  await circular.save();

  const started = Date.now();
  let pipelineResult;

  try {
    pipelineResult = await runPipeline(text);
  } catch (error) {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.error ||
      error.message ||
      "AI service unreachable";

    circular.status = "failed";
    circular.processingMeta = {
      ...toPlainMeta(circular.processingMeta),
      extractionError: String(message),
    };
    await circular.save();

    const wrapped = new Error(String(message));
    wrapped.status = 502;
    throw wrapped;
  }

  const durationMs = Date.now() - started;
  const aiMeta = pipelineResult.processingMeta || {};

  circular.entities = pipelineResult.entities || [];
  circular.summary = pipelineResult.summary || null;
  circular.status = "completed";
  circular.processingMeta = {
    ...toPlainMeta(circular.processingMeta),
    model: aiMeta.model || null,
    tokensUsed: aiMeta.tokensUsed || 0,
    durationMs,
    cached: false,
    guardrailWarnings: pipelineResult.guardrailWarnings || [],
    chunkCount: aiMeta.chunkCount || 1,
  };
  await circular.save();

  return {
    circular,
    cached: false,
    guardrailWarnings: pipelineResult.guardrailWarnings || [],
  };
}

function toPlainMeta(meta) {
  return meta?.toObject?.() ?? meta ?? {};
}

module.exports = {
  canAccess,
  createFromUpload,
  extractText,
  hashText,
  listFilter,
  processCircular,
  saveEditedText,
  serializeCircular,
  workingText,
};
