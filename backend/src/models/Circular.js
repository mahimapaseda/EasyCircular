const mongoose = require("mongoose");

const entitySchema = new mongoose.Schema(
  {
    text: String,
    label: {
      type: String,
      enum: ["DATE", "PERSON", "ORG", "LAW", "OTHER"],
    },
    start: Number,
    end: Number,
  },
  { _id: false },
);

const summarySectionSchema = new mongoose.Schema(
  {
    heading: String,
    content: String,
  },
  { _id: false },
);

const summarySchema = new mongoose.Schema(
  {
    title: String,
    sections: [summarySectionSchema],
    actionItems: [String],
    rawMarkdown: String,
    mode: String,
  },
  { _id: false },
);

const circularSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    sessionId: {
      type: String,
      default: null,
      index: true,
    },
    originalFilename: { type: String, required: true },
    filePath: { type: String, required: true },
    contentHash: { type: String, default: "", index: true },
    extractedText: { type: String, default: "" },
    editedText: { type: String, default: null },
    status: {
      type: String,
      enum: ["uploaded", "extracted", "processing", "completed", "failed"],
      default: "uploaded",
      index: true,
    },
    entities: [entitySchema],
    summary: { type: summarySchema, default: null },
    processingMeta: {
      ocrUsed: { type: Boolean, default: false },
      ocrLang: { type: String, default: null },
      pageCount: { type: Number, default: 0 },
      extractionError: { type: String, default: null },
      processingError: { type: String, default: null },
      model: { type: String, default: null },
      tokensUsed: { type: Number, default: 0 },
      durationMs: { type: Number, default: 0 },
      cached: { type: Boolean, default: false },
      guardrailWarnings: { type: [String], default: [] },
      chunkCount: { type: Number, default: 1 },
    },
  },
  { timestamps: true },
);

circularSchema.index({ sessionId: 1, createdAt: -1 });

module.exports = mongoose.model("Circular", circularSchema);
