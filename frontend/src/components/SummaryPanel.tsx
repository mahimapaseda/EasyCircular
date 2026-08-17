"use client";

import { useEffect, useMemo, useState } from "react";
import AnimateIn from "@/components/AnimateIn";
import { exportSummaryAsPdf } from "@/lib/exportSummary";
import type { Circular, CircularSummary } from "@/lib/circulars";

const ENTITY_STYLE: Record<string, { pill: string; dot: string; label: string }> = {
  DATE: {
    pill: "border-amber-400/20 bg-amber-400/[0.07] text-amber-200/90",
    dot: "bg-amber-400",
    label: "Dates",
  },
  PERSON: {
    pill: "border-sky-400/20 bg-sky-400/[0.07] text-sky-200/90",
    dot: "bg-sky-400",
    label: "People",
  },
  ORG: {
    pill: "border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-200/90",
    dot: "bg-cyan-400",
    label: "Organizations",
  },
  LAW: {
    pill: "border-violet-400/20 bg-violet-400/[0.07] text-violet-200/90",
    dot: "bg-violet-400",
    label: "References",
  },
  OTHER: {
    pill: "border-white/10 bg-white/[0.04] text-slate-300",
    dot: "bg-slate-400",
    label: "Other",
  },
};

function entityStyle(label: string) {
  return ENTITY_STYLE[label] || ENTITY_STYLE.OTHER;
}

type SummaryPanelProps = {
  circular: Circular;
  processing: boolean;
  editing: boolean;
  saving: boolean;
  draftSummary: CircularSummary | null;
  onEditStart: () => void;
  onEditCancel: () => void;
  onDraftChange: (summary: CircularSummary) => void;
  onSave: () => void;
  onRegenerate?: () => void;
  onExport?: (format: "txt" | "pdf") => void;
};

function actionItemsToText(items: string[]): string {
  return items.join("\n");
}

function textToActionItems(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

const inputClass =
  "w-full rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/35 focus:ring-1 focus:ring-cyan-400/20";

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm leading-snug text-slate-100">{value}</dd>
    </div>
  );
}

export default function SummaryPanel({
  circular,
  processing,
  editing,
  saving,
  draftSummary,
  onEditStart,
  onEditCancel,
  onDraftChange,
  onSave,
  onRegenerate,
  onExport,
}: SummaryPanelProps) {
  const summary = circular.summary;
  const meta = circular.processingMeta;
  const hasText = Boolean(circular.extractedText || circular.editedText);
  const [actionItemsDraft, setActionItemsDraft] = useState("");
  const [showAllEntities, setShowAllEntities] = useState(false);
  const [exporting, setExporting] = useState(false);

  const entityCap = 12;
  const visibleEntities = useMemo(() => {
    if (showAllEntities) return circular.entities;
    return circular.entities.slice(0, entityCap);
  }, [circular.entities, showAllEntities]);
  const hiddenEntityCount = Math.max(0, circular.entities.length - entityCap);

  useEffect(() => {
    if (editing && draftSummary) {
      setActionItemsDraft(actionItemsToText(draftSummary.actionItems));
    }
  }, [editing, draftSummary]);

  async function handleExportPdf() {
    if (exporting) return;
    setExporting(true);
    try {
      await exportSummaryAsPdf(circular);
      onExport?.("pdf");
    } finally {
      setExporting(false);
    }
  }

  async function handleCopy() {
    const text =
      summary?.rawMarkdown ||
      summary?.sections.map((s) => `${s.heading}\n${s.content}`).join("\n\n") ||
      "";
    if (!text) return;
    await navigator.clipboard.writeText(text);
    onExport?.("txt");
  }

  function updateDraft(patch: Partial<CircularSummary>) {
    if (!draftSummary) return;
    onDraftChange({ ...draftSummary, ...patch });
  }

  function updateSection(index: number, patch: Partial<{ heading: string; content: string }>) {
    if (!draftSummary) return;
    const sections = draftSummary.sections.map((section, i) =>
      i === index ? { ...section, ...patch } : section,
    );
    onDraftChange({ ...draftSummary, sections });
  }

  function commitActionItems(text: string) {
    setActionItemsDraft(text);
    if (!draftSummary) return;
    onDraftChange({ ...draftSummary, actionItems: textToActionItems(text) });
  }

  const modeLabel = (() => {
    if (editing || summary?.mode === "edited") return "Edited";
    if (summary?.mode === "fallback") return "Extractive";
    if (summary?.mode === "llm") return "AI";
    return null;
  })();

  const hasMeta =
    Boolean(summary?.circularNumber) ||
    Boolean(summary?.issuedDate) ||
    Boolean(summary?.issuedBy) ||
    Boolean(summary?.targetAudience) ||
    Boolean(summary?.effectiveDate);

  return (
    <section className="relative flex min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-black/25 backdrop-blur-xl">
      <div className="flex flex-col gap-2.5 border-b border-white/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-3.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Brief
          </span>
          {modeLabel && (
            <span className="text-[10px] font-medium text-slate-500">· {modeLabel}</span>
          )}
          {meta.cached && !editing && (
            <span className="text-[10px] font-medium text-slate-600">· Cached</span>
          )}
          {meta.durationMs && circular.status === "completed" && !editing && (
            <span className="text-[10px] font-medium text-slate-600">
              · {(meta.durationMs / 1000).toFixed(1)}s
            </span>
          )}
        </div>

        {summary && !editing && (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                disabled={processing || circular.status === "processing"}
                className="hidden min-h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-60 md:inline-flex lg:hidden"
              >
                {processing || circular.status === "processing" ? "Summarizing…" : "Regenerate"}
              </button>
            )}
            <div className="flex w-full items-center gap-0.5 rounded-lg border border-white/[0.08] bg-white/[0.02] p-0.5 sm:w-auto">
              <button
                type="button"
                onClick={onEditStart}
                className="min-h-10 flex-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white sm:flex-none"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="min-h-10 flex-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white sm:flex-none"
              >
                Copy
              </button>
              <button
                type="button"
                onClick={() => void handleExportPdf()}
                disabled={exporting}
                className="min-h-10 flex-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-60 sm:flex-none"
              >
                {exporting ? "Exporting…" : "Export"}
              </button>
            </div>
          </div>
        )}

        {summary && editing && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEditCancel}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-white/10 hover:text-white"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-900 disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7 lg:px-9 lg:py-8">
        {summary?.mode === "fallback" && meta.llmError && !editing && (
          <div className="mb-6 rounded-lg border border-rose-400/20 bg-rose-400/[0.06] px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-rose-300">
              AI summary unavailable
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-rose-100/85">
              {meta.llmError} A basic extractive summary is shown instead — use Regenerate to retry.
            </p>
          </div>
        )}

        {meta.guardrailWarnings && meta.guardrailWarnings.length > 0 && !editing && (
          <div className="mb-6 rounded-lg border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-300">
              Review suggested
            </p>
            <ul className="mt-1.5 space-y-1">
              {meta.guardrailWarnings.map((w) => (
                <li key={w} className="text-sm leading-relaxed text-amber-100/85">
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!summary && !processing && circular.status !== "processing" && (
          <div className="flex min-h-[min(48vh,420px)] flex-col items-center justify-center px-4 text-center">
            <p className="font-display text-lg font-bold text-white">No summary yet</p>
            <p className="mt-2 max-w-sm text-sm text-slate-400">
              {hasText
                ? "Generate a structured brief with purpose, deadlines, and action items."
                : "Extract text from the PDF first — summarization follows automatically."}
            </p>
          </div>
        )}

        {(processing || circular.status === "processing") && (
          <div className="flex min-h-[min(48vh,420px)] flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            <div className="text-center">
              <p className="text-sm font-semibold text-white">Building brief…</p>
              <p className="mt-0.5 text-xs text-slate-400">Reading structure and key references</p>
            </div>
          </div>
        )}

        {summary && !editing && (
          <article className="w-full">
            <AnimateIn>
              <header className="border-b border-white/[0.06] pb-6">
                <h2 className="max-w-4xl font-display text-xl font-bold leading-[1.25] tracking-tight text-white sm:text-2xl lg:text-[1.85rem]">
                  {summary.title}
                </h2>

                {hasMeta && (
                  <dl className="mt-5 grid gap-x-8 gap-y-4 border-t border-white/[0.05] pt-5 sm:grid-cols-2 lg:grid-cols-4">
                    {summary.circularNumber && (
                      <MetaCell label="Number" value={summary.circularNumber} />
                    )}
                    {summary.issuedDate && (
                      <MetaCell label="Issued" value={summary.issuedDate} />
                    )}
                    {summary.issuedBy && (
                      <MetaCell label="Issued by" value={summary.issuedBy} />
                    )}
                    {summary.effectiveDate && (
                      <MetaCell label="Effective" value={summary.effectiveDate} />
                    )}
                    {summary.targetAudience && (
                      <div className="min-w-0 sm:col-span-2 lg:col-span-4">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Audience
                        </dt>
                        <dd className="mt-1 text-sm leading-relaxed text-slate-200">
                          {summary.targetAudience}
                        </dd>
                      </div>
                    )}
                  </dl>
                )}
              </header>
            </AnimateIn>

            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,34%)] lg:items-start lg:gap-10">
              <div className="min-w-0 space-y-7">
                {summary.sections.map((section, index) => (
                  <AnimateIn key={`${section.heading}-${index}`} delay={40 * (index + 1)}>
                    <section className="relative pl-12 sm:pl-14">
                      <span className="absolute left-0 top-0 font-display text-sm font-bold tabular-nums text-cyan-400/80">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        {section.heading}
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-slate-200 sm:text-base sm:leading-7">
                        {section.content}
                      </p>
                    </section>
                  </AnimateIn>
                ))}
              </div>

              <aside className="min-w-0 space-y-6 lg:sticky lg:top-4">
                {summary.actionItems.length > 0 && (
                  <AnimateIn delay={80}>
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5">
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        Action items
                      </h3>
                      <ol className="mt-4 space-y-3">
                        {summary.actionItems.map((item, i) => (
                          <li key={item} className="flex gap-3 text-sm leading-relaxed text-slate-200">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/15 text-[10px] font-bold text-slate-300">
                              {i + 1}
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </AnimateIn>
                )}

                {circular.entities.length > 0 && (
                  <AnimateIn delay={120}>
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5">
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        Key references
                      </h3>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {visibleEntities.map((e, i) => {
                          const s = entityStyle(e.label);
                          return (
                            <span
                              key={`${e.start}-${i}`}
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${s.pill}`}
                              title={e.label}
                            >
                              <span className={`h-1 w-1 rounded-full ${s.dot}`} />
                              {e.text}
                            </span>
                          );
                        })}
                        {!showAllEntities && hiddenEntityCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowAllEntities(true)}
                            className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-slate-400 transition hover:text-white"
                          >
                            +{hiddenEntityCount} more
                          </button>
                        )}
                      </div>
                    </div>
                  </AnimateIn>
                )}

                {summary.actionItems.length === 0 && circular.entities.length === 0 && (
                  <p className="text-xs text-slate-500 lg:pt-2">
                    Expand Source text above to review the original circular.
                  </p>
                )}
              </aside>
            </div>
          </article>
        )}

        {summary && editing && draftSummary && (
          <div className="w-full max-w-5xl space-y-5">
            <p className="text-sm text-slate-400">
              Refine the brief before export. Changes stay on this document only.
            </p>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Title
              </span>
              <input
                type="text"
                value={draftSummary.title}
                onChange={(e) => updateDraft({ title: e.target.value })}
                className={`${inputClass} text-base font-semibold`}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Number
                </span>
                <input
                  type="text"
                  value={draftSummary.circularNumber || ""}
                  onChange={(e) => updateDraft({ circularNumber: e.target.value || null })}
                  className={inputClass}
                  placeholder="e.g. 10/2026"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Issued date
                </span>
                <input
                  type="text"
                  value={draftSummary.issuedDate || ""}
                  onChange={(e) => updateDraft({ issuedDate: e.target.value || null })}
                  className={inputClass}
                  placeholder="e.g. 04.05.2026"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Issued by
                </span>
                <input
                  type="text"
                  value={draftSummary.issuedBy || ""}
                  onChange={(e) => updateDraft({ issuedBy: e.target.value || null })}
                  className={inputClass}
                  placeholder="e.g. Ministry of Education"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Effective date
                </span>
                <input
                  type="text"
                  value={draftSummary.effectiveDate || ""}
                  onChange={(e) => updateDraft({ effectiveDate: e.target.value || null })}
                  className={inputClass}
                  placeholder="e.g. With immediate effect"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Audience
                </span>
                <input
                  type="text"
                  value={draftSummary.targetAudience || ""}
                  onChange={(e) => updateDraft({ targetAudience: e.target.value || null })}
                  className={inputClass}
                  placeholder="e.g. All Provincial Education Secretaries"
                />
              </label>
            </div>

            <div className="space-y-4">
              {draftSummary.sections.map((section, index) => (
                <div
                  key={`${section.heading}-${index}`}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="font-display text-xs font-bold text-cyan-400/80">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Section
                    </span>
                  </div>
                  <label className="mb-3 block">
                    <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      Heading
                    </span>
                    <input
                      type="text"
                      value={section.heading}
                      onChange={(e) => updateSection(index, { heading: e.target.value })}
                      className={`${inputClass} font-semibold`}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      Content
                    </span>
                    <textarea
                      value={section.content}
                      onChange={(e) => updateSection(index, { content: e.target.value })}
                      rows={Math.max(4, Math.min(12, section.content.split("\n").length + 1))}
                      className={`${inputClass} resize-y leading-relaxed`}
                    />
                  </label>
                </div>
              ))}
            </div>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Action items
              </span>
              <span className="mb-2 block text-xs text-slate-500">One item per line</span>
              <textarea
                value={actionItemsDraft}
                onChange={(e) => commitActionItems(e.target.value)}
                rows={5}
                placeholder="Enter each action on its own line"
                className={`${inputClass} resize-y leading-relaxed`}
              />
            </label>
          </div>
        )}
      </div>
    </section>
  );
}
