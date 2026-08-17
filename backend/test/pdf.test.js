const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { assertUploadedPdf, isPdfHeader } = require("../src/utils/pdf");

test("isPdfHeader accepts %PDF- magic bytes", () => {
  assert.equal(isPdfHeader(Buffer.from("%PDF-1.4")), true);
  assert.equal(isPdfHeader(Buffer.from("not a pdf")), false);
  assert.equal(isPdfHeader(Buffer.from("%PD")), false);
});

test("assertUploadedPdf rejects empty and non-PDF files", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "easycircular-pdf-"));
  const emptyPath = path.join(dir, "empty.pdf");
  const textPath = path.join(dir, "note.pdf");
  const pdfPath = path.join(dir, "ok.pdf");
  fs.writeFileSync(emptyPath, "");
  fs.writeFileSync(textPath, "hello");
  fs.writeFileSync(pdfPath, "%PDF-1.4\n");

  assert.throws(() => assertUploadedPdf({ path: emptyPath }), /empty/);
  assert.throws(() => assertUploadedPdf({ path: textPath }), /not a valid PDF/);
  assert.doesNotThrow(() => assertUploadedPdf({ path: pdfPath }));

  fs.rmSync(dir, { recursive: true, force: true });
});
