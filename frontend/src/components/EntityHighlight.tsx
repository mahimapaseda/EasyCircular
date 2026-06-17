import type { ReactNode } from "react";
import type { Entity } from "@/lib/circulars";

const LABEL_CONFIG: Record<
  Entity["label"],
  { light: string; dark: string; label: string; dot: string; glow: string }
> = {
  DATE: {
    light: "bg-gradient-to-r from-amber-50 to-amber-100/50 text-amber-900 border border-amber-300/50 shadow-sm",
    dark: "dark:from-amber-900/30 dark:to-amber-950/20 dark:text-amber-200 dark:border-amber-700/40",
    label: "DATE",
    dot: "bg-amber-500",
    glow: "shadow-amber-500/30",
  },
  PERSON: {
    light: "bg-gradient-to-r from-fuchsia-50 to-fuchsia-100/50 text-fuchsia-900 border border-fuchsia-300/50 shadow-sm",
    dark: "dark:from-fuchsia-900/30 dark:to-fuchsia-950/20 dark:text-fuchsia-200 dark:border-fuchsia-700/40",
    label: "PERSON",
    dot: "bg-fuchsia-500",
    glow: "shadow-fuchsia-500/30",
  },
  ORG: {
    light: "bg-gradient-to-r from-brand-50 to-brand-100/50 text-brand-900 border border-brand-300/50 shadow-sm",
    dark: "dark:from-brand-900/30 dark:to-brand-950/20 dark:text-brand-200 dark:border-brand-700/40",
    label: "ORG",
    dot: "bg-brand-500",
    glow: "shadow-brand-500/30",
  },
  LAW: {
    light: "bg-gradient-to-r from-cyan-50 to-cyan-100/50 text-cyan-900 border border-cyan-300/50 shadow-sm",
    dark: "dark:from-cyan-900/30 dark:to-cyan-950/20 dark:text-cyan-200 dark:border-cyan-700/40",
    label: "LAW",
    dot: "bg-cyan-500",
    glow: "shadow-cyan-500/30",
  },
  OTHER: {
    light: "bg-gradient-to-r from-ink-50 to-ink-100/50 text-ink-800 border border-ink-300/50 shadow-sm",
    dark: "dark:from-ink-800/30 dark:to-ink-900/20 dark:text-ink-200 dark:border-ink-700/40",
    label: "OTHER",
    dot: "bg-ink-400",
    glow: "shadow-ink-500/30",
  },
};

type EntityHighlightProps = {
  text: string;
  entities: Entity[];
  className?: string;
};

export default function EntityHighlight({
  text,
  entities,
  className = "",
}: EntityHighlightProps) {
  if (!text) {
    return (
      <p className={`text-sm text-ink-500 dark:text-ink-400 ${className}`}>
        No text to display.
      </p>
    );
  }

  const valid = [...entities]
    .filter(
      (e) =>
        e.start >= 0 &&
        e.end > e.start &&
        e.end <= text.length &&
        e.text?.trim(),
    )
    .sort((a, b) => a.start - b.start);

  if (valid.length === 0) {
    return (
      <div
        className={`whitespace-pre-wrap text-[15px] leading-[1.8] text-ink-800 dark:text-ink-100 ${className}`}
      >
        {text}
      </div>
    );
  }

  const parts: ReactNode[] = [];
  let cursor = 0;

  valid.forEach((entity, index) => {
    if (entity.start > cursor) {
      parts.push(
        <span key={`t-${index}-${cursor}`}>{text.slice(cursor, entity.start)}</span>,
      );
    }

    const cfg = LABEL_CONFIG[entity.label] || LABEL_CONFIG.OTHER;

    parts.push(
      <mark
        key={`e-${index}-${entity.start}`}
        className={`group relative inline-flex cursor-default items-baseline rounded-xl px-1.5 py-0.5 mx-0.5 font-bold transition-all duration-300 hover:scale-[1.03] hover:shadow-lg ${cfg.glow} ${cfg.light} ${cfg.dark}`}
      >
        {text.slice(entity.start, entity.end)}
        
        {/* Animated Tooltip */}
        <span className="pointer-events-none absolute -top-9 left-1/2 z-20 flex -translate-x-1/2 scale-95 items-center gap-1.5 whitespace-nowrap rounded-xl bg-ink-900/95 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-white opacity-0 shadow-xl backdrop-blur-md transition-all duration-200 group-hover:-translate-y-1 group-hover:scale-100 group-hover:opacity-100 dark:bg-white/95 dark:text-ink-950">
          <span className={`h-2 w-2 rounded-full ${cfg.dot} shadow-sm`} />
          {cfg.label}
          
          {/* Tooltip arrow */}
          <svg className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 text-ink-900/95 dark:text-white/95" viewBox="0 0 24 24" fill="currentColor">
             <path d="M12 21l-8-8h16l-8 8z"/>
          </svg>
        </span>
      </mark>,
    );

    cursor = Math.max(cursor, entity.end);
  });

  if (cursor < text.length) {
    parts.push(<span key="t-end">{text.slice(cursor)}</span>);
  }

  return (
    <div
      className={`whitespace-pre-wrap text-[15px] font-medium leading-[2] tracking-tight text-ink-800 dark:text-ink-100 ${className}`}
    >
      {parts}
    </div>
  );
}
