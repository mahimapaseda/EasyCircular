import type { ReactNode } from "react";
import type { Entity } from "@/lib/circulars";

const LABEL_STYLES: Record<Entity["label"], string> = {
  DATE: "bg-amber-200/90 text-amber-950 dark:bg-amber-500/25 dark:text-amber-100",
  PERSON: "bg-violet-200/90 text-violet-950 dark:bg-violet-500/25 dark:text-violet-100",
  ORG: "bg-brand-200/90 text-brand-950 dark:bg-brand-500/25 dark:text-brand-100",
  LAW: "bg-rose-200/90 text-rose-950 dark:bg-rose-500/25 dark:text-rose-100",
  OTHER: "bg-ink-200/90 text-ink-800 dark:bg-ink-600/40 dark:text-ink-100",
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
