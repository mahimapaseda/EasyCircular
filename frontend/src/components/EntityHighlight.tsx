import type { ReactNode } from "react";
import type { Entity } from "@/lib/circulars";

const LABEL_CONFIG: Record<
  Entity["label"],
  { light: string; dark: string; label: string; dot: string }
> = {
  DATE: {
    light: "bg-amber-100 text-amber-900 ring-1 ring-amber-300/60",
    dark: "dark:bg-amber-400/15 dark:text-amber-200 dark:ring-amber-600/40",
    label: "DATE",
    dot: "bg-amber-500",
  },
  PERSON: {
    light: "bg-fuchsia-100 text-fuchsia-900 ring-1 ring-fuchsia-300/60",
    dark: "dark:bg-fuchsia-400/15 dark:text-fuchsia-200 dark:ring-fuchsia-600/40",
    label: "PERSON",
    dot: "bg-fuchsia-500",
  },
  ORG: {
    light: "bg-brand-100 text-brand-900 ring-1 ring-brand-300/60",
    dark: "dark:bg-brand-400/15 dark:text-brand-200 dark:ring-brand-600/40",
    label: "ORG",
    dot: "bg-brand-500",
  },
  LAW: {
    light: "bg-cyan-100 text-cyan-900 ring-1 ring-cyan-300/60",
    dark: "dark:bg-cyan-400/15 dark:text-cyan-200 dark:ring-cyan-600/40",
    label: "LAW",
    dot: "bg-cyan-500",
  },
  OTHER: {
    light: "bg-ink-100 text-ink-800 ring-1 ring-ink-300/60",
    dark: "dark:bg-ink-600/20 dark:text-ink-200 dark:ring-ink-600/40",
    label: "OTHER",
    dot: "bg-ink-400",
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
        className={`whitespace-pre-wrap text-sm leading-relaxed text-ink-800 dark:text-ink-100 ${className}`}
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
        title={entity.label}
        className={`group relative inline-flex cursor-default items-baseline rounded-md px-1 py-0.5 font-medium transition-transform duration-150 hover:scale-105 ${cfg.light} ${cfg.dark}`}
      >
        {text.slice(entity.start, entity.end)}
        {/* Tooltip */}
        <span className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-lg bg-ink-900 px-2 py-1 text-[10px] font-bold text-white shadow-lg group-hover:flex dark:bg-ink-950">
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
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
      className={`whitespace-pre-wrap text-sm leading-relaxed text-ink-800 dark:text-ink-100 ${className}`}
    >
      {parts}
    </div>
  );
}
