import { API_URL } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import {
  captureSessionFromResponse,
  sessionHeaders,
} from "@/lib/session";

export type CircularStatus =
  | "uploaded"
  | "extracted"
  | "processing"
  | "completed"
  | "failed";

export type EntityLabel = "DATE" | "PERSON" | "ORG" | "LAW" | "OTHER";

export type Entity = {
  text: string;
  label: EntityLabel;
  start: number;
  end: number;
};

export type CircularSummary = {
  title: string;
  sections: { heading: string; content: string }[];
  actionItems: string[];
  rawMarkdown: string;
  mode?: string;
};

export type CircularProcessingMeta = {
  ocrUsed: boolean;
  ocrLang: string | null;
  pageCount: number;
  extractionError: string | null;
  model?: string | null;
  tokensUsed?: number;
  durationMs?: number;
  cached?: boolean;
  guardrailWarnings?: string[];
  chunkCount?: number;
};

export type Circular = {
  id: string;
  originalFilename: string;
  status: CircularStatus;
  extractedText: string;
  editedText: string | null;
  contentHash: string;
  entities: Entity[];
  summary: CircularSummary | null;
  processingMeta: CircularProcessingMeta;
  createdAt: string;
  updatedAt: string;
};

export type CircularListResponse = {
  items: Circular[];
  page: number;
  limit: number;
  total: number;
};

function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  const headers: Record<string, string> = { ...sessionHeaders() };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function apiFetch(
  input: string,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, {
    ...init,
    headers: {
      ...authHeaders(),
      ...(init?.headers || {}),
    },
  });
  captureSessionFromResponse(response);
  return response;
}

async function parseError(response: Response): Promise<string> {
  const body = await response.json().catch(() => ({}));
  return body.error || body.detail || `Request failed (${response.status})`;
}

export async function uploadCircular(file: File): Promise<Circular> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiFetch(`${API_URL}/api/circulars/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = await response.json();
  return data.circular;
}

export async function listCirculars(): Promise<CircularListResponse> {
  const response = await apiFetch(`${API_URL}/api/circulars`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
}

export async function fetchCircular(id: string): Promise<Circular> {
  const response = await apiFetch(`${API_URL}/api/circulars/${id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = await response.json();
  return data.circular;
}

export async function extractCircularText(
  id: string,
): Promise<{ circular: Circular; error?: string }> {
  const response = await apiFetch(`${API_URL}/api/circulars/${id}/extract`, {
    method: "POST",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (data.circular) {
      return { circular: data.circular, error: data.error || "Extraction failed" };
    }
    throw new Error(data.error || data.detail || "Extraction failed");
  }

  return { circular: data.circular };
}

export function cloneSummary(summary: CircularSummary): CircularSummary {
  return {
    title: summary.title,
    sections: summary.sections.map((section) => ({ ...section })),
    actionItems: [...summary.actionItems],
    rawMarkdown: summary.rawMarkdown,
    mode: summary.mode,
  };
}

export async function saveCircularSummary(
  id: string,
  summary: CircularSummary,
): Promise<Circular> {
  const response = await apiFetch(`${API_URL}/api/circulars/${id}/summary`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ summary }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = await response.json();
  return data.circular;
}

export async function saveCircularText(
  id: string,
  text: string,
): Promise<Circular> {
  const response = await apiFetch(`${API_URL}/api/circulars/${id}/text`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = await response.json();
  return data.circular;
}

export async function claimSessionCirculars(): Promise<{ claimed: number }> {
  const response = await apiFetch(`${API_URL}/api/auth/claim-session`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
}

export async function processCircular(
  id: string,
): Promise<{ circular: Circular; cached?: boolean; guardrailWarnings?: string[] }> {
  const response = await apiFetch(`${API_URL}/api/circulars/${id}/process`, {
    method: "POST",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.detail || "Processing failed");
  }

  return data;
}

export function displayText(circular: Circular): string {
  return circular.editedText ?? circular.extractedText ?? "";
}

export function workflowStep(circular: Circular): number {
  switch (circular.status) {
    case "uploaded":
      return 2;
    case "extracted":
    case "failed":
      return 3;
    case "processing":
      return 4;
    case "completed":
      return 5; // all workflow steps complete
    default:
      return 1;
  }
}

export function statusLabel(status: CircularStatus): string {
  switch (status) {
    case "uploaded":
      return "Uploaded";
    case "extracted":
      return "Ready to review";
    case "processing":
      return "Processing";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}
