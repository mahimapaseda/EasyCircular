const mongoose = require("mongoose");

const circularSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    originalFilename: { type: String, required: true },
    filePath: { type: String, required: true },
    contentHash: { type: String, default: "" },
    extractedText: { type: String, default: "" },
    editedText: { type: String, default: null },
    status: {
      type: String,
      enum: ["uploaded", "extracted", "processing", "completed", "failed"],
      default: "uploaded",
      index: true,
    },
    processingMeta: {
      ocrUsed: { type: Boolean, default: false },
      ocrLang: { type: String, default: null },
      pageCount: { type: Number, default: 0 },
      extractionError: { type: String, default: null },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Circular", circularSchema);
