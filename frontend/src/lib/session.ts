const SESSION_KEY = "easycircular_session_id";

export function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(SESSION_KEY);
    return value && /^[a-f0-9-]{36}$/i.test(value) ? value : null;
  } catch {
    return null;
  }
}

export function setSessionId(sessionId: string) {
  if (typeof window === "undefined") return;
  if (!/^[a-f0-9-]{36}$/i.test(sessionId)) return;
  localStorage.setItem(SESSION_KEY, sessionId);
}

export function captureSessionFromResponse(response: Response) {
  const sessionId = response.headers.get("x-session-id");
  if (sessionId) {
    setSessionId(sessionId);
  }
}

export function sessionHeaders(): Record<string, string> {
  const sessionId = getSessionId();
  if (!sessionId) return {};
  return { "X-Session-Id": sessionId };
}
