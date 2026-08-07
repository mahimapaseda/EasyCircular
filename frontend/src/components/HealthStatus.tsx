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
      text: "text-emerald-300",
      label: "ok",
    },
    degraded: {
      dot: "bg-amber-400 shadow-amber-400/60",
      text: "text-amber-300",
      label: "degraded",
    },
    offline: {
      dot: "bg-rose-400 shadow-rose-400/60",
      text: "text-rose-300",
      label: "offline",
    },
    checking: {
      dot: "bg-white/30 animate-pulse",
      text: "text-white/40",
      label: "checking…",
    },
  }[status];

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2.5">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      <span className={`flex items-center gap-2 text-xs font-bold ${config.text}`}>
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

  const llmProvider = health?.llmProvider || null;
  const llmConfigured = Boolean(health?.llmConfigured);
  const llmStatus: ServiceStatus = loading
    ? "checking"
    : !llmProvider
    ? "offline"
    : llmConfigured
    ? "ok"
    : "degraded";

  const llmDetail = loading
    ? undefined
    : !llmProvider
    ? "unknown"
    : llmConfigured
    ? `${llmProvider}${health?.llmModel ? ` / ${health.llmModel}` : ""}`
    : llmProvider === "ollama"
    ? "ollama offline (extractive fallback)"
    : `${llmProvider} not configured`;

  const allOk =
    apiStatus === "ok" && dbStatus === "ok" && aiStatus === "ok" && llmStatus === "ok";

  return (
    <div>
      <div
        className={`mb-4 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${
          loading
            ? "border-white/10 bg-white/5 text-white/40"
            : allOk
            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
            : "border-amber-400/20 bg-amber-400/10 text-amber-300"
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            loading ? "bg-white/30 animate-pulse" : allOk ? "bg-emerald-400" : "bg-amber-400"
          }`}
        />
        {loading ? "Connecting to services…" : allOk ? "All systems operational" : "Some services degraded"}
      </div>

      <ul className="space-y-1.5">
        <ServiceRow label="Backend API" status={apiStatus} detail={health?.status} />
        <ServiceRow label="MongoDB" status={dbStatus} detail={health?.mongodb} />
        <ServiceRow label="AI Service" status={aiStatus} detail={health?.aiService} />
        <ServiceRow label="LLM" status={llmStatus} detail={llmDetail} />
      </ul>

      {!loading && !compact && (
        <p className="mt-3 text-right text-[11px] font-medium text-white/20">
          Refreshes every 15s
        </p>
      )}
    </div>
  );
}
