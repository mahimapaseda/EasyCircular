"use client";

type ConfidenceGaugeProps = {
  value: number;
  size?: number;
  label?: string;
  subtitle?: string;
  /** Ring + number only — for sticky header chrome (~40px). */
  compact?: boolean;
  className?: string;
};

/** Pick a ring gradient that shifts with score, similar to the reference cards. */
function gradientFor(value: number): { id: string; stops: [string, string, string?] } {
  if (value >= 85) {
    return { id: "conf-hi", stops: ["#7c3aed", "#ec4899", "#f97316"] };
  }
  if (value >= 65) {
    return { id: "conf-mid-hi", stops: ["#8b5cf6", "#d946ef", "#f43f5e"] };
  }
  if (value >= 40) {
    return { id: "conf-mid", stops: ["#14b8a6", "#6366f1", "#a855f7"] };
  }
  return { id: "conf-lo", stops: ["#38bdf8", "#3b82f6"] };
}

function badgeTone(value: number): string {
  if (value >= 85) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300";
  if (value >= 65) return "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300";
  if (value >= 40) return "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300";
  return "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300";
}

/**
 * Circular score gauge inspired by the reference cards:
 * thick gradient arc from 12 o'clock, white-rimmed end knob, centered label + value.
 * Compact mode: ring + bold number only for header chrome.
 */
export default function ConfidenceGauge({
  value,
  size,
  label = "Confidence",
  subtitle = "OCR score",
  compact = false,
  className = "",
}: ConfidenceGaugeProps) {
  const resolvedSize = size ?? (compact ? 40 : 88);
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const stroke = compact
    ? Math.max(4, Math.round(resolvedSize * 0.12))
    : Math.max(8, Math.round(resolvedSize * 0.1));
  const pad = stroke / 2 + (compact ? 2 : 4);
  const r = (resolvedSize - pad * 2) / 2;
  const cx = resolvedSize / 2;
  const cy = resolvedSize / 2;
  const circumference = 2 * Math.PI * r;
  const progress = (clamped / 100) * circumference;
  const grad = gradientFor(clamped);
  const uniqueId = `${grad.id}-${resolvedSize}-${clamped}-${compact ? "c" : "f"}`;

  const angle = (clamped / 100) * 360 - 90;
  const rad = (angle * Math.PI) / 180;
  const knobX = cx + r * Math.cos(rad);
  const knobY = cy + r * Math.sin(rad);
  const knobR = Math.max(compact ? 3 : 5, stroke * 0.55);
  const endColor = grad.stops[grad.stops.length - 1] ?? grad.stops[0];

  const valueSize = compact
    ? "text-[11px]"
    : resolvedSize >= 100
      ? "text-2xl"
      : resolvedSize >= 80
        ? "text-xl"
        : resolvedSize >= 64
          ? "text-lg"
          : "text-base";

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: resolvedSize, height: resolvedSize }}
      role="img"
      aria-label={`${clamped}% ${label}`}
      title={`${clamped}% ${label}`}
    >
      <svg
        width={resolvedSize}
        height={resolvedSize}
        viewBox={`0 0 ${resolvedSize} ${resolvedSize}`}
        className="absolute inset-0"
      >
        <defs>
          <linearGradient id={uniqueId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={grad.stops[0]} />
            <stop offset="55%" stopColor={grad.stops[1] ?? grad.stops[0]} />
            {grad.stops[2] && <stop offset="100%" stopColor={grad.stops[2]} />}
          </linearGradient>
        </defs>

        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke * (compact ? 0.65 : 0.55)}
          className="text-slate-200 dark:text-white/15"
        />

        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={`url(#${uniqueId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference - progress}`}
          transform={`rotate(-90 ${cx} ${cy})`}
        />

        {clamped > 0 && (
          <circle
            cx={knobX}
            cy={knobY}
            r={knobR}
            fill={endColor}
            stroke="white"
            strokeWidth={Math.max(compact ? 1.5 : 2, stroke * 0.28)}
          />
        )}
      </svg>

      <div
        className={`relative z-[1] flex flex-col items-center text-center ${
          compact ? "max-w-[70%]" : "max-w-[72%] px-1"
        }`}
      >
        {!compact && (
          <span
            className={`mb-0.5 rounded-full px-1.5 py-px text-[8px] font-bold uppercase tracking-wide ${badgeTone(clamped)}`}
          >
            {label}
          </span>
        )}
        <span
          className={`font-display font-bold leading-none tracking-tight text-ink-900 dark:text-white ${valueSize}`}
        >
          {clamped}
        </span>
        {!compact && (
          <span className="mt-0.5 text-[9px] font-medium leading-tight text-ink-500 dark:text-slate-400">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
