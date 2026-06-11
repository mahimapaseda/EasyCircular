function notFoundHandler(_req, res) {
  res.status(404).json({ error: "Route not found" });
}

function errorHandler(err, req, res, _next) {
  if (multerLikeError(err)) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File exceeds the 20 MB limit"
        : err.message;
    return res.status(400).json({ error: message });
  }

  console.error(`[${req.method} ${req.path}]`, err.message);

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.expose ? err.message : "Internal server error",
  });
}

function multerLikeError(err) {
  return err?.name === "MulterError" || err?.code === "LIMIT_FILE_SIZE";
}

module.exports = { errorHandler, notFoundHandler };
