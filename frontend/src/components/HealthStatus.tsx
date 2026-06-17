"use client";

import { useEffect, useState } from "react";
import { fetchBackendHealth, type HealthCheck } from "@/lib/api";

type ServiceStatus = "ok" | "degraded" | "offline" | "checking";

function ServiceRow({
  label,
  status,
  detail,
}: {
  label: string;
  status: ServiceStatus;
  detail?: string;
}) {
  const config = {
    ok: {
      dot: "bg-emerald-400 shadow-emerald-400/60",
      ring: "ring-emerald-200 dark:ring-emerald-800",
      text: "text-emerald-700 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      label: "Online",
    },
    degraded: {
      dot: "bg-amber-400 shadow-amber-400/60",
      ring: "ring-amber-200 dark:ring-amber-800",
      text: "text-amber-700 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      label: "Degraded",
    },
    offline: {
      dot: "bg-rose-400 shadow-rose-400/60",
      ring: "ring-rose-200 dark:ring-rose-800",
      text: "text-rose-700 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/30",
      label: "Offline",
    },
    checking: {
      dot: "bg-ink-300 animate-pulse",
      ring: "ring-ink-200 dark:ring-ink-700",
      text: "text-ink-500 dark:text-ink-400",
      bg: "bg-ink-50 dark:bg-ink-800/30",
      label: "Checking…",
    },
  }[status];

  return (
    <li className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 ${config.bg}`}>
      <span className="text-sm font-semibold text-ink-700 dark:text-ink-300">{label}</span>
      <span className={`flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${config.ring} ${config.text}`}>
        <span className={`h-2 w-2 rounded-full shadow-sm ${config.dot}`} />
        {detail || config.label}
      </span>
    </li>
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

  const apiStatus: ServiceStatus = loading
    ? "checking"
    : error
    ? "offline"
    : health?.status === "ok"
    ? "ok"
    : "degraded";

  const dbStatus: ServiceStatus = loading
    ? "checking"
    : health?.mongodb === "connected"
    ? "ok"
    : health?.mongodb
    ? "degraded"
    : "offline";

  const aiStatus: ServiceStatus = loading
    ? "checking"
    : health?.aiService === "ok"
    ? "ok"
    : health?.aiService
    ? "degraded"
    : "offline";

  const allOk = apiStatus === "ok" && dbStatus === "ok" && aiStatus === "ok";

  return (
    <div>
      {/* Overall badge */}
      <div
        className={`mb-4 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${
          loading
            ? "bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400"
            : allOk
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
            : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            loading ? "bg-ink-400 animate-pulse" : allOk ? "bg-emerald-500 animate-pulse-glow" : "bg-amber-500"
          }`}
        />
        {loading ? "Connecting to services…" : allOk ? "All systems operational" : "Some services degraded"}
      </div>

      <ul className="space-y-2">
        <ServiceRow label="Backend API" status={apiStatus} detail={health?.status} />
        <ServiceRow label="MongoDB" status={dbStatus} detail={health?.mongodb} />
        <ServiceRow label="AI Service" status={aiStatus} detail={health?.aiService} />
      </ul>

      {!loading && (
        <p className="mt-3 text-right text-[11px] font-medium text-ink-400 dark:text-ink-600">
          Refreshes every 15s
        </p>
      )}
    </div>
  );
}
