const express = require("express");
const { authRequired } = require("../middleware/auth");
const { rateLimit } = require("../middleware/rateLimit");
const { getOfficialCircular, listOfficialCirculars } = require("../services/moeCatalog");
const { importOfficialPdf } = require("../services/circularService");
const { SESSION_HEADER } = require("../middleware/session");

const router = express.Router();

const importRateLimit = rateLimit({
  windowMs: 60_000,
  max: Number(process.env.MOE_IMPORT_RATE_LIMIT || 6),
  keyPrefix: "moe-import",
});

function setSessionHeader(res, req) {
  if (req.sessionId) {
    res.setHeader(SESSION_HEADER, req.sessionId);
  }
}

router.get("/circulars", async (req, res, next) => {
  try {
    const catalog = await listOfficialCirculars({
      page: req.query.page,
      perPage: req.query.limit,
      search: req.query.search,
    });
    res.json(catalog);
  } catch (error) {
    next(error);
  }
});

router.get("/circulars/:id", async (req, res, next) => {
  try {
    const detail = await getOfficialCircular(req.params.id);
    res.json(detail);
  } catch (error) {
    next(error);
  }
});

router.post("/import", authRequired, importRateLimit, async (req, res, next) => {
  try {
    const moeId = Number(req.body?.moeId);
    const mediaId = Number(req.body?.mediaId);
    if (!Number.isInteger(moeId) || moeId <= 0 || !Number.isInteger(mediaId) || mediaId <= 0) {
      return res.status(400).json({ error: "moeId and mediaId are required" });
    }

    const result = await importOfficialPdf({
      moeId,
      mediaId,
      user: req.user,
      sessionId: req.sessionId,
    });

    setSessionHeader(res, req);
    res.status(result.created ? 201 : 200).json({
      circularId: result.circular.id,
      circular: result.circular,
      created: result.created,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
