const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const axios = require("axios");
const Circular = require("../models/Circular");
const { authOptional } = require("../middleware/auth");

const router = express.Router();

const UPLOAD_DIR = path.resolve(
  process.env.UPLOAD_DIR || path.join(__dirname, "../../uploads"),
);
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:5000";
const MAX_FILE_SIZE = 20 * 1024 * 1024;

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
    const safeName = file.originalname.replace(/[^\w.\-() ]/g, "_");
    cb(null, `${unique}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
      return;
    }
    cb(new Error("Only PDF files are allowed"));
  },
});

function hashText(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function serializeCircular(doc) {
  return {
    id: doc._id.toString(),
    originalFilename: doc.originalFilename,
    status: doc.status,
    extractedText: doc.extractedText,
    editedText: doc.editedText,
    contentHash: doc.contentHash,
    processingMeta: doc.processingMeta,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

router.post("/upload", authOptional, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "PDF file is required" });
    }

    const circular = await Circular.create({
      userId: req.user?.id || null,
      originalFilename: req.file.originalname,
      filePath: req.file.path,
      status: "uploaded",
    });

    res.status(201).json({
      circularId: circular._id.toString(),
      circular: serializeCircular(circular),
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File exceeds the 20 MB limit" });
    }

    res.status(500).json({
      error: error.message || "Upload failed",
    });
  }
});

router.get("/", authOptional, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    let filter = {};
    if (req.user?.id) {
      filter = { userId: req.user.id };
    } else if (req.query.ids) {
      const ids = String(req.query.ids)
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      filter = { _id: { $in: ids }, userId: null };
    } else {
      return res.json({ items: [], page, limit, total: 0 });
    }

    const [items, total] = await Promise.all([
      Circular.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Circular.countDocuments(filter),
    ]);

    res.json({
      items: items.map(serializeCircular),
      page,
      limit,
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to list circulars" });
  }
});

router.get("/:id", authOptional, async (req, res) => {
  try {
    const circular = await Circular.findById(req.params.id);
    if (!circular) {
      return res.status(404).json({ error: "Circular not found" });
    }

    if (req.user?.id && circular.userId && circular.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ circular: serializeCircular(circular) });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to fetch circular" });
  }
});

router.post("/:id/extract", authOptional, async (req, res) => {
  try {
    const circular = await Circular.findById(req.params.id);
    if (!circular) {
      return res.status(404).json({ error: "Circular not found" });
    }

    if (!fs.existsSync(circular.filePath)) {
      circular.status = "failed";
      circular.processingMeta.extractionError = "PDF file missing on server";
      await circular.save();
      return res.status(410).json({ error: "PDF file missing on server" });
    }

    const fileBuffer = fs.readFileSync(circular.filePath);
    const base64 = fileBuffer.toString("base64");

    let aiResult;
    try {
      const aiResponse = await axios.post(
        `${AI_SERVICE_URL}/parse/pdf`,
        { base64, filename: circular.originalFilename },
        { timeout: 120000 },
      );
      aiResult = aiResponse.data;
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message ||
        "AI service unreachable";

      circular.status = "failed";
      circular.processingMeta.extractionError = String(message);
      await circular.save();

      return res.status(502).json({ error: String(message) });
    }

    const extractedText = (aiResult.text || "").trim();
    const pageCount = aiResult.pages || 0;
    const ocrUsed = Boolean(aiResult.ocrUsed);
    const extractionError = aiResult.error || null;

    if (!extractedText) {
      circular.status = "failed";
      circular.extractedText = "";
      circular.processingMeta = {
        ocrUsed,
        pageCount,
        extractionError:
          extractionError ||
          "No readable text found. The PDF may be empty, corrupt, or image-only without OCR.",
      };
      await circular.save();

      return res.status(422).json({
        error: circular.processingMeta.extractionError,
        circular: serializeCircular(circular),
      });
    }

    circular.extractedText = extractedText;
    circular.contentHash = hashText(extractedText);
    circular.status = "extracted";
    circular.processingMeta = {
      ocrUsed,
      pageCount,
      extractionError: extractionError,
    };
    await circular.save();

    res.json({ circular: serializeCircular(circular) });
  } catch (error) {
    res.status(500).json({ error: error.message || "Extraction failed" });
  }
});

router.patch("/:id/text", authOptional, async (req, res) => {
  try {
    const { text } = req.body;
    if (typeof text !== "string") {
      return res.status(400).json({ error: "text field is required" });
    }

    const circular = await Circular.findById(req.params.id);
    if (!circular) {
      return res.status(404).json({ error: "Circular not found" });
    }

    if (circular.status === "uploaded") {
      return res.status(400).json({
        error: "Extract text from the PDF before saving edits",
      });
    }

    const trimmed = text.trim();
    circular.editedText = trimmed;
    circular.contentHash = hashText(trimmed || circular.extractedText);
    if (circular.status !== "completed" && circular.status !== "processing") {
      circular.status = "extracted";
    }
    await circular.save();

    res.json({ circular: serializeCircular(circular) });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to save text" });
  }
});

router.delete("/:id", authOptional, async (req, res) => {
  try {
    const circular = await Circular.findById(req.params.id);
    if (!circular) {
      return res.status(404).json({ error: "Circular not found" });
    }

    if (req.user?.id && circular.userId && circular.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (fs.existsSync(circular.filePath)) {
      fs.unlinkSync(circular.filePath);
    }

    await circular.deleteOne();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to delete circular" });
  }
});

module.exports = router;
