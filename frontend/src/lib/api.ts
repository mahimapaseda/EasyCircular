const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export type HealthCheck = {
  service: string;
  status: "ok" | "degraded";
  timestamp: string;
  mongodb?: string;
  aiService?: string;
};

export async function fetchBackendHealth(): Promise<HealthCheck> {
  const response = await fetch(`${API_URL}/health`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as HealthCheck | null;
    if (body?.service) {
      return body;
    }
    throw new Error(`Backend health check failed (${response.status})`);
  }

  return response.json();
}

export { API_URL };
