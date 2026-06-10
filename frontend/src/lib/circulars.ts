import { API_URL } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";

const LOCAL_CIRCULARS_KEY = "easycircular_local_circulars";

export type CircularStatus =
  | "uploaded"
  | "extracted"
  | "processing"
  | "completed"
  | "failed";

export type CircularProcessingMeta = {
  ocrUsed: boolean;
  ocrLang: string | null;
  pageCount: number;
  extractionError: string | null;
};

export type Circular = {
  id: string;
  originalFilename: string;
  status: CircularStatus;
  extractedText: string;
  editedText: string | null;
  contentHash: string;
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

function authHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export function getLocalCircularIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_CIRCULARS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function rememberLocalCircular(id: string) {
  if (typeof window === "undefined") return;
  const ids = getLocalCircularIds();
  if (!ids.includes(id)) {
    localStorage.setItem(LOCAL_CIRCULARS_KEY, JSON.stringify([id, ...ids]));
  }
}

async function parseError(response: Response): Promise<string> {
  const body = await response.json().catch(() => ({}));
  return body.error || body.detail || `Request failed (${response.status})`;
}

export async function uploadCircular(file: File): Promise<Circular> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/api/circulars/upload`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = await response.json();
  if (!getStoredToken()) {
    rememberLocalCircular(data.circularId);
  }
  return data.circular;
}

export async function listCirculars(): Promise<CircularListResponse> {
  const token = getStoredToken();
  const query = token
    ? ""
    : `?ids=${encodeURIComponent(getLocalCircularIds().join(","))}`;

  const response = await fetch(`${API_URL}/api/circulars${query}`, {
    headers: authHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
}

export async function fetchCircular(id: string): Promise<Circular> {
  const response = await fetch(`${API_URL}/api/circulars/${id}`, {
    headers: authHeaders(),
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
  const response = await fetch(`${API_URL}/api/circulars/${id}/extract`, {
    method: "POST",
    headers: authHeaders(),
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

export async function saveCircularText(
  id: string,
  text: string,
): Promise<Circular> {
  const response = await fetch(`${API_URL}/api/circulars/${id}/text`, {
    method: "PATCH",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = await response.json();
  return data.circular;
}

export function displayText(circular: Circular): string {
  return circular.editedText ?? circular.extractedText ?? "";
}

export function workflowStep(circular: Circular): number {
  if (circular.status === "uploaded") return 2;
  if (circular.status === "extracted" || circular.status === "failed") return 3;
  return 4;
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
