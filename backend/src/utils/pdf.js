const fs = require("fs");

const PDF_MAGIC = "%PDF-";

function isPdfHeader(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < PDF_MAGIC.length) {
    return false;
  }
  return buffer.subarray(0, PDF_MAGIC.length).toString("latin1") === PDF_MAGIC;
}

function assertUploadedPdf(file) {
  if (!file?.path) {
    const error = new Error("PDF file is required");
    error.status = 400;
    error.expose = true;
    throw error;
  }

  const stat = fs.statSync(file.path);
  if (stat.size === 0) {
    const error = new Error("PDF file is empty");
    error.status = 400;
    error.expose = true;
    throw error;
  }

  const fd = fs.openSync(file.path, "r");
  try {
    const header = Buffer.alloc(PDF_MAGIC.length);
    const bytesRead = fs.readSync(fd, header, 0, PDF_MAGIC.length, 0);
    if (bytesRead < PDF_MAGIC.length || !isPdfHeader(header)) {
      const error = new Error("File is not a valid PDF");
      error.status = 400;
      error.expose = true;
      throw error;
    }
  } finally {
    fs.closeSync(fd);
  }
}

module.exports = { assertUploadedPdf, isPdfHeader, PDF_MAGIC };
