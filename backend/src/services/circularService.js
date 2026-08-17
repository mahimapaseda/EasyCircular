const fs = require("fs");
const crypto = require("crypto");
const Circular = require("../models/Circular");
const { parsePdf, runPipeline } = require("./aiClient");

// Must match ai-service/app/summarize.py SUMMARIZER_VERSION
const SUMMARIZER_VERSION = "v2-source-fewshot";

function hashText(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function workingText(circular) {
  return (circular.editedText || circular.extractedText || "").trim();
}

function serializeCircular(doc) {
  const summary = doc.summary
    ? {
        circularNumber: doc.summary.circularNumber || null,
        issuedDate: doc.summary.issuedDate || null,
        issuedBy: doc.summary.issuedBy || null,
        targetAudience: doc.summary.targetAudience || null,
        effectiveDate: doc.summary.effectiveDate || null,
        title: doc.summary.title,
        sections: doc.summary.sections,
        actionItems: doc.summary.actionItems,
        rawMarkdown: doc.summary.rawMarkdown,
        mode: doc.summary.mode,
      }
    : null;

  return {
    id: doc._id.toString(),
    originalFilename: doc.originalFilename,
    status: doc.status,
    extractedText: doc.extractedText,
    editedText: doc.editedText,
    contentHash: doc.contentHash,
    entities: doc.entities || [],
    summary,
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
  if (!circular.sessionId || !sessionId) return false;
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

  const watermarkOnly = /^(camscanner|scanned\s+by|scanned\s+with|scanbot|adobe\s+scan)$/i.test(
    extractedText.replace(/\s+/g, " ").trim(),
  );
  const tooShort = extractedText.length > 0 && extractedText.length < 80;

  if (!extractedText || watermarkOnly || (tooShort && !ocrUsed)) {
    circular.status = "failed";
    circular.extractedText = "";
    circular.processingMeta = {
      ocrUsed,
      ocrLang,
      pageCount,
      extractionError:
        extractionError ||
        (watermarkOnly
          ? "Only a scanner watermark was found (e.g. CamScanner). Re-run Extract so OCR can read the scanned page."
          : "No readable text found. The PDF may be empty, corrupt, or image-only without OCR."),
    };
    await circular.save();

    const error = new Error(circular.processingMeta.extractionError);
    error.status = 422;
    error.circular = serializeCircular(circular);
    throw error;
  }

  circular.extractedText = extractedText;
  circular.editedText = null;
  circular.entities = [];
  circular.summary = null;
  circular.contentHash = hashText(extractedText);
  circular.status = "extracted";
  circular.processingMeta = {
    ocrUsed,
    ocrLang,
    pageCount,
    extractionError,
    processingError: null,
  };
  await circular.save();
  return circular;
}

function buildSummaryMarkdown(summary) {
  const lines = [`# ${summary.title || "Circular summary"}`, ""];

  const metaFields = [
    ["Circular Number", summary.circularNumber],
    ["Issued Date", summary.issuedDate],
    ["Issued By", summary.issuedBy],
    ["Target Audience", summary.targetAudience],
    ["Effective Date", summary.effectiveDate],
  ];
  const metaLines = metaFields
    .filter(([, value]) => value)
    .map(([label, value]) => `**${label}:** ${value}`);
  if (metaLines.length > 0) {
    lines.push(...metaLines);
    lines.push("");
  }

  for (const section of summary.sections || []) {
    lines.push(`## ${section.heading || "Section"}`);
    lines.push(section.content || "");
    lines.push("");
  }
  const actions = summary.actionItems || [];
  if (actions.length > 0) {
    lines.push("## Action items");
    for (const item of actions) {
      lines.push(`- ${item}`);
    }
  }
  return lines.join("\n").trim();
}

function normalizeSummaryInput(summary) {
  if (!summary || typeof summary !== "object") {
    const error = new Error("summary object is required");
    error.status = 400;
    throw error;
  }

  const title = typeof summary.title === "string" ? summary.title.trim() : "";
  if (!title) {
    const error = new Error("summary title is required");
    error.status = 400;
    throw error;
  }

  if (!Array.isArray(summary.sections) || summary.sections.length === 0) {
    const error = new Error("At least one summary section is required");
    error.status = 400;
    throw error;
  }

  const sections = summary.sections.map((section, index) => {
    const heading =
      typeof section?.heading === "string" && section.heading.trim()
        ? section.heading.trim()
        : `Section ${index + 1}`;
    const content =
      typeof section?.content === "string" ? section.content.trim() : "";
    return { heading, content };
  });

  const actionItems = Array.isArray(summary.actionItems)
    ? summary.actionItems
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
    : [];

  const circularNumber =
    typeof summary.circularNumber === "string" ? summary.circularNumber.trim() || null : null;
  const issuedDate =
    typeof summary.issuedDate === "string" ? summary.issuedDate.trim() || null : null;
  const issuedBy =
    typeof summary.issuedBy === "string" ? summary.issuedBy.trim() || null : null;
  const targetAudience =
    typeof summary.targetAudience === "string" ? summary.targetAudience.trim() || null : null;
  const effectiveDate =
    typeof summary.effectiveDate === "string" ? summary.effectiveDate.trim() || null : null;

  const normalized = {
    circularNumber,
    issuedDate,
    issuedBy,
    targetAudience,
    effectiveDate,
    title,
    sections,
    actionItems,
    rawMarkdown: "",
    mode: typeof summary.mode === "string" ? summary.mode : "edited",
  };
  normalized.rawMarkdown = buildSummaryMarkdown(normalized);
  return normalized;
}

async function saveEditedSummary(circular, summary) {
  if (!circular.summary) {
    const error = new Error("Generate a summary before editing");
    error.status = 400;
    throw error;
  }

  const normalized = normalizeSummaryInput({
    ...summary,
    mode: summary?.mode || circular.summary.mode || "edited",
  });

  circular.summary = normalized;
  circular.status = "completed";
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

async function findCachedSummary(contentHash, excludeId, userId = null, model = null) {
  const filter = {
    contentHash,
    status: "completed",
    _id: { $ne: excludeId },
    summary: { $ne: null },
    "processingMeta.summarizerVersion": SUMMARIZER_VERSION,
  };

  if (userId) {
    filter.userId = userId;
  } else {
    filter.userId = null;
  }

  if (model) {
    filter["processingMeta.model"] = model;
  }

  return Circular.findOne(filter).sort({ updatedAt: -1 });
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

  const cached = await findCachedSummary(contentHash, circular._id, circular.userId);
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
      summarizerVersion:
        cached.processingMeta?.summarizerVersion || SUMMARIZER_VERSION,
    };
    await circular.save();
    return { circular, cached: true, guardrailWarnings: circular.processingMeta.guardrailWarnings };
  }

  circular.status = "processing";
  await circular.save();

  const started = Date.now();
  let pipelineResult;

  try {
    pipelineResult = await runPipeline(text, circular.originalFilename);
  } catch (error) {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.error ||
      error.message ||
      "AI service unreachable";

    circular.status = "failed";
    circular.processingMeta = {
      ...toPlainMeta(circular.processingMeta),
      processingError: String(message),
      extractionError: null,
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
    llmError: aiMeta.llmError || null,
    summarizerVersion: aiMeta.summarizerVersion || SUMMARIZER_VERSION,
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

async function claimSessionCirculars(user, sessionId) {
  if (!user?.id || !sessionId) {
    return { claimed: 0 };
  }

  const result = await Circular.updateMany(
    { userId: null, sessionId },
    { $set: { userId: user.id }, $unset: { sessionId: 1 } },
  );

  return { claimed: result.modifiedCount };
}

module.exports = {
  canAccess,
  claimSessionCirculars,
  createFromUpload,
  extractText,
  hashText,
  listFilter,
  processCircular,
  saveEditedSummary,
  saveEditedText,
  serializeCircular,
  workingText,
};
