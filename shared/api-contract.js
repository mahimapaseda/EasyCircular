/**
 * Cross-service API contract for EasyCircular.
 * Imported by backend; mirrored in frontend TypeScript types.
 */

const CIRCULAR_STATUS = Object.freeze({
  UPLOADED: "uploaded",
  EXTRACTED: "extracted",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
});

const ENTITY_LABELS = Object.freeze([
  "DATE",
  "PERSON",
  "ORG",
  "LAW",
  "OTHER",
]);

const WORKFLOW_STEPS = Object.freeze([
  { id: 1, key: "upload", label: "Upload" },
  { id: 2, key: "extract", label: "Extract" },
  { id: 3, key: "review", label: "Review" },
  { id: 4, key: "summarize", label: "Summarize" },
]);

const API_VERSION = "v1";
const MAX_UPLOAD_MB = 50;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

module.exports = {
  API_VERSION,
  CIRCULAR_STATUS,
  ENTITY_LABELS,
  WORKFLOW_STEPS,
  MAX_UPLOAD_MB,
  MAX_UPLOAD_BYTES,
};
