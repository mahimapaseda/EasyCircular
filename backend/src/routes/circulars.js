const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const Circular = require("../models/Circular");
const { authOptional, authRequired } = require("../middleware/auth");
const { rateLimit } = require("../middleware/rateLimit");
const { SESSION_HEADER } = require("../middleware/session");
const {
  canAccess,
  createFromUpload,
  extractText,
  listFilter,
  processCircular,
  saveEditedSummary,
  saveEditedText,
  serializeCircular,
} = require("../services/circularService");

const router = express.Router();

const UPLOAD_DIR = path.resolve(
  process.env.UPLOAD_DIR || path.join(__dirname, "../../uploads"),
);
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

const processRateLimit = rateLimit({
  windowMs: 60_000,
  max: Number(process.env.PROCESS_RATE_LIMIT || 10),
  keyPrefix: "process",
});

function setSessionHeader(res, req) {
  if (req.sessionId) {
    res.setHeader(SESSION_HEADER, req.sessionId);
  }
}

function denyUnlessOwner(circular, req, res) {
  if (!canAccess(circular, req.user, req.sessionId)) {
    res.status(403).json({ error: "Access denied" });
    return false;
  }
  return true;
}

router.post("/upload", authRequired, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "PDF file is required" });
    }

    const circular = await createFromUpload({
      file: req.file,
      user: req.user,
      sessionId: req.sessionId,
    });

    setSessionHeader(res, req);
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

    next(error);
  }
});

router.get("/", authOptional, async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = listFilter(req.user, req.sessionId);

    const [items, total] = await Promise.all([
      Circular.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Circular.countDocuments(filter),
    ]);

    setSessionHeader(res, req);
    res.json({
      items: items.map(serializeCircular),
      page,
      limit,
      total,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", authOptional, async (req, res, next) => {
  try {
    const circular = await Circular.findById(req.params.id);
    if (!circular) {
      return res.status(404).json({ error: "Circular not found" });
    }

    if (!denyUnlessOwner(circular, req, res)) return;

    setSessionHeader(res, req);
    res.json({ circular: serializeCircular(circular) });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/extract", authOptional, async (req, res, next) => {
  try {
    const circular = await Circular.findById(req.params.id);
    if (!circular) {
      return res.status(404).json({ error: "Circular not found" });
    }
    if (!denyUnlessOwner(circular, req, res)) return;

    await extractText(circular);
    setSessionHeader(res, req);
    res.json({ circular: serializeCircular(circular) });
  } catch (error) {
    if (error.circular) {
      setSessionHeader(res, req);
      return res.status(error.status || 422).json({
        error: error.message,
        circular: error.circular,
      });
    }
    next(error);
  }
});

router.patch("/:id/text", authOptional, async (req, res, next) => {
  try {
    const { text } = req.body;
    if (typeof text !== "string") {
      return res.status(400).json({ error: "text field is required" });
    }

    const circular = await Circular.findById(req.params.id);
    if (!circular) {
      return res.status(404).json({ error: "Circular not found" });
    }
    if (!denyUnlessOwner(circular, req, res)) return;

    await saveEditedText(circular, text);
    setSessionHeader(res, req);
    res.json({ circular: serializeCircular(circular) });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
});

router.patch("/:id/summary", authOptional, async (req, res, next) => {
  try {
    const { summary } = req.body;
    if (!summary || typeof summary !== "object") {
      return res.status(400).json({ error: "summary object is required" });
    }

    const circular = await Circular.findById(req.params.id);
    if (!circular) {
      return res.status(404).json({ error: "Circular not found" });
    }
    if (!denyUnlessOwner(circular, req, res)) return;

    await saveEditedSummary(circular, summary);
    setSessionHeader(res, req);
    res.json({ circular: serializeCircular(circular) });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
});

router.post("/:id/process", authOptional, processRateLimit, async (req, res, next) => {
  try {
    const circular = await Circular.findById(req.params.id);
    if (!circular) {
      return res.status(404).json({ error: "Circular not found" });
    }
    if (!denyUnlessOwner(circular, req, res)) return;

    const result = await processCircular(circular);
    setSessionHeader(res, req);
    res.json({
      circular: serializeCircular(result.circular),
      cached: result.cached,
      guardrailWarnings: result.guardrailWarnings,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
});

router.delete("/:id", authOptional, async (req, res, next) => {
  try {
    const circular = await Circular.findById(req.params.id);
    if (!circular) {
      return res.status(404).json({ error: "Circular not found" });
    }
    if (!denyUnlessOwner(circular, req, res)) return;

    if (fs.existsSync(circular.filePath)) {
      fs.unlinkSync(circular.filePath);
    }

    await circular.deleteOne();
    setSessionHeader(res, req);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
