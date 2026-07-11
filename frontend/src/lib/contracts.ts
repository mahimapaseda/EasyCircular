export const API_VERSION = "v1";
export const MAX_UPLOAD_MB = 50;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

export const WORKFLOW_STEPS = [
  { id: 1, key: "upload", label: "Upload", description: "Select a PDF circular" },
  { id: 2, key: "extract", label: "Extract", description: "Read document text" },
  { id: 3, key: "review", label: "Review", description: "Correct extraction errors" },
  { id: 4, key: "summarize", label: "Summarize", description: "Generate structured summary" },
] as const;

export type WorkflowStepKey = (typeof WORKFLOW_STEPS)[number]["key"];
