"use client";

import { useEffect, useState } from "react";
import { fetchBackendHealth, type HealthCheck } from "@/lib/api";

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${
        ok ? "bg-emerald-500" : "bg-rose-500"
      }`}
    />
  );
}

type HealthStatusProps = {
  compact?: boolean;
};

export default function HealthStatus({ compact = false }: HealthStatusProps) {
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchBackendHealth();
        if (!cancelled) {
          setHealth(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Offline");
          setHealth(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    const interval = setInterval(load, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (compact) {
    const allOk = health?.status === "ok";

    return (
      <div className="panel p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
          System status
        </p>
        {loading ? (
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">Checking…</p>
        ) : error ? (
          <p className="mt-2 flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400">
            <StatusDot ok={false} />
            Services offline
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-ink-600 dark:text-ink-300">
            <li className="flex items-center justify-between gap-3">
              <span>API</span>
              <span className="flex items-center gap-2">
                <StatusDot ok={allOk} />
                {health?.status}
              </span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Database</span>
              <span className="flex items-center gap-2">
                <StatusDot ok={health?.mongodb === "connected"} />
                {health?.mongodb ?? "—"}
              </span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>AI</span>
              <span className="flex items-center gap-2">
                <StatusDot ok={health?.aiService === "ok"} />
                {health?.aiService ?? "—"}
              </span>
            </li>
          </ul>
        )}
      </div>
    );
  }

  if (loading) {
    return <p className="text-sm text-ink-500 dark:text-ink-400">Checking services…</p>;
  }

  if (error) {
    return (
      <p className="text-sm font-medium text-rose-700 dark:text-rose-300">{error}</p>
    );
  }

  if (!health) return null;

  return (
    <ul className="space-y-2 text-sm text-ink-600 dark:text-ink-300">
      <li className="flex items-center justify-between gap-3">
        <span>API</span>
        <span className="flex items-center gap-2">
          <StatusDot ok={health.status === "ok"} />
          {health.status}
        </span>
      </li>
      <li className="flex items-center justify-between gap-3">
        <span>Database</span>
        <span className="flex items-center gap-2">
          <StatusDot ok={health.mongodb === "connected"} />
          {health.mongodb}
        </span>
      </li>
      <li className="flex items-center justify-between gap-3">
        <span>AI service</span>
        <span className="flex items-center gap-2">
          <StatusDot ok={health.aiService === "ok"} />
          {health.aiService}
        </span>
      </li>
    </ul>
  );
}
