import type { ReactNode } from "react";
import type { Entity } from "@/lib/circulars";

const LABEL_STYLES: Record<Entity["label"], string> = {
  DATE: "bg-sun-200/80 text-sun-900 dark:bg-sun-500/25 dark:text-sun-100",
  PERSON: "bg-grape-200/80 text-grape-900 dark:bg-grape-500/25 dark:text-grape-100",
  ORG: "bg-brand-200/80 text-brand-900 dark:bg-brand-500/25 dark:text-brand-100",
  LAW: "bg-coral-200/80 text-coral-900 dark:bg-coral-500/25 dark:text-coral-100",
  OTHER: "bg-slate-200/80 text-slate-800 dark:bg-slate-600/40 dark:text-slate-100",
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
      <p className={`text-sm text-slate-500 dark:text-slate-400 ${className}`}>
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
        className={`whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-slate-100 ${className}`}
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

    parts.push(
      <mark
        key={`e-${index}-${entity.start}`}
        title={entity.label}
        className={`rounded px-0.5 ${LABEL_STYLES[entity.label] || LABEL_STYLES.OTHER}`}
      >
        {text.slice(entity.start, entity.end)}
      </mark>,
    );

    cursor = Math.max(cursor, entity.end);
  });

  if (cursor < text.length) {
    parts.push(<span key={`t-end`}>{text.slice(cursor)}</span>);
  }

  return (
    <div
      className={`whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-slate-100 ${className}`}
    >
      {parts}
    </div>
  );
}
