"use client";

import { useEffect, useMemo, useState } from "react";
import AnimateIn from "@/components/AnimateIn";
import { exportSummaryAsPdf } from "@/lib/exportSummary";
import type { Circular, CircularSummary, SummaryLang } from "@/lib/circulars";

const ENTITY_STYLE: Record<string, { pill: string; dot: string; label: string }> = {
  DATE: {
    pill: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/[0.07] dark:text-amber-200/90",
    dot: "bg-amber-500 dark:bg-amber-400",
    label: "Dates",
  },
  PERSON: {
    pill: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-400/20 dark:bg-sky-400/[0.07] dark:text-sky-200/90",
    dot: "bg-sky-500 dark:bg-sky-400",
    label: "People",
  },
  ORG: {
    pill: "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-400/20 dark:bg-cyan-400/[0.07] dark:text-cyan-200/90",
    dot: "bg-cyan-600 dark:bg-cyan-400",
    label: "Organizations",
  },
  LAW: {
    pill: "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-400/20 dark:bg-violet-400/[0.07] dark:text-violet-200/90",
    dot: "bg-violet-500 dark:bg-violet-400",
    label: "References",
  },
  OTHER: {
    pill: "border-slate-200 bg-slate-50 text-ink-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300",
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
  onTranslate?: (targetLang: SummaryLang) => Promise<void>;
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

const META_LABELS: Record<SummaryLang, Record<string, string>> = {
  en: {
    brief: "Brief",
    number: "Number",
    issued: "Issued",
    issuedBy: "Issued by",
    effective: "Effective",
    audience: "Audience",
    actions: "Action items",
    refs: "Key references",
  },
  si: {
    brief: "සාරාංශය",
    number: "අංකය",
    issued: "නිකුත් කළ දිනය",
    issuedBy: "නිකුත් කළේ",
    effective: "බලපැවැත්වෙන",
    audience: "පිළිගන්නන්",
    actions: "ක්‍රියාමාර්ග",
    refs: "යොමු",
  },
  ta: {
    brief: "சுருக்கம்",
    number: "எண்",
    issued: "வெளியிடப்பட்டது",
    issuedBy: "வெளியிட்டவர்",
    effective: "நடைமுறை",
    audience: "பெறுநர்கள்",
    actions: "நடவடிக்கைகள்",
    refs: "குறிப்புகள்",
  },
};

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="ws-label">
        {label}
      </dt>
      <dd className="mt-1 text-sm leading-snug text-ink-800 dark:text-slate-100">{value}</dd>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none placeholder:text-ink-400 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-400/20 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500";

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
  onTranslate,
}: SummaryPanelProps) {
  const sourceSummary = circular.summary;
  const sourceLang: SummaryLang = sourceSummary?.language || "en";
  const [viewLang, setViewLang] = useState<SummaryLang>(sourceLang);
  const [translating, setTranslating] = useState(false);
  const [actionItemsDraft, setActionItemsDraft] = useState("");
  const [showAllEntities, setShowAllEntities] = useState(false);
  const [exporting, setExporting] = useState(false);
  const meta = circular.processingMeta;
  const hasText = Boolean(circular.extractedText || circular.editedText);
  const labels = META_LABELS[viewLang] || META_LABELS.en;

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

  useEffect(() => {
    setViewLang(sourceLang);
  }, [circular.id, sourceLang]);

  const displayed: CircularSummary | null = editing
    ? draftSummary
    : !sourceSummary
      ? null
      : viewLang === sourceLang
        ? sourceSummary
        : sourceSummary.translations?.[viewLang] || null;

  const langOptions: { id: SummaryLang; label: string }[] =
    sourceLang === "ta"
      ? [
          { id: "ta", label: "தமிழ்" },
          { id: "en", label: "English" },
        ]
      : sourceLang === "si"
        ? [
            { id: "si", label: "සිංහල" },
            { id: "en", label: "English" },
          ]
        : [
            { id: "en", label: "English" },
            { id: "si", label: "සිංහල" },
          ];

  async function handleExportPdf() {
    if (exporting) return;
    setExporting(true);
    try {
      await exportSummaryAsPdf({
        ...circular,
        summary: displayed || circular.summary,
      });
      onExport?.("pdf");
    } finally {
      setExporting(false);
    }
  }

  async function handleCopy() {
    const text =
      displayed?.rawMarkdown ||
      displayed?.sections.map((s) => `${s.heading}\n${s.content}`).join("\n\n") ||
      "";
    if (!text) return;
    await navigator.clipboard.writeText(text);
    onExport?.("txt");
  }

  async function selectLang(next: SummaryLang) {
    if (next === viewLang || editing) return;
    if (next !== sourceLang && !sourceSummary?.translations?.[next]?.title) {
      if (!onTranslate) return;
      setTranslating(true);
      try {
        await onTranslate(next);
        setViewLang(next);
      } finally {
        setTranslating(false);
      }
      return;
    }
    setViewLang(next);
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
    if (editing || sourceSummary?.mode === "edited") return "Edited";
    if (sourceSummary?.mode === "fallback") return "Extractive";
    if (sourceSummary?.mode === "llm") return "AI";
    return null;
  })();

  const hasMeta =
    Boolean(displayed?.circularNumber) ||
    Boolean(displayed?.issuedDate) ||
    Boolean(displayed?.issuedBy) ||
    Boolean(displayed?.targetAudience) ||
    Boolean(displayed?.effectiveDate);

  return (
    <section className="ws-panel relative flex min-h-0 w-full flex-col overflow-hidden rounded-2xl">
      <div className="flex flex-col gap-2.5 border-b border-slate-200 px-4 py-3 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-3.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="ws-label tracking-[0.2em]">{labels.brief}</span>
          {sourceSummary && langOptions.length > 1 && !editing && (
            <div className="ml-2 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-white/10 dark:bg-white/[0.03]">
              {langOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => void selectLang(option.id)}
                  disabled={translating || processing}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition disabled:opacity-60 ${
                    viewLang === option.id
                      ? "bg-cyan-600 text-white dark:bg-white/15 dark:text-white"
                      : "text-ink-500 hover:text-ink-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  {translating && viewLang !== option.id && option.id !== sourceLang
                    ? "…"
                    : option.label}
                </button>
              ))}
            </div>
          )}
          {modeLabel && (
            <span className="ws-muted text-[10px] font-medium">· {modeLabel}</span>
          )}
          {meta.cached && !editing && (
            <span className="ws-muted text-[10px] font-medium">· Cached</span>
          )}
          {meta.durationMs && circular.status === "completed" && !editing && (
            <span className="ws-muted text-[10px] font-medium">
              · {(meta.durationMs / 1000).toFixed(1)}s
            </span>
          )}
        </div>

        {sourceSummary && !editing && (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                disabled={processing || circular.status === "processing"}
                className="hidden min-h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-ink-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/12 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/10 md:inline-flex lg:hidden"
              >
                {processing || circular.status === "processing" ? "Summarizing…" : "Regenerate"}
              </button>
            )}
            <div className="flex w-full items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-white/[0.08] dark:bg-white/[0.02] sm:w-auto">
              <button
                type="button"
                onClick={onEditStart}
                disabled={viewLang !== sourceLang}
                className="min-h-10 flex-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-ink-700 transition hover:bg-white hover:text-ink-900 disabled:opacity-40 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white sm:flex-none"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="min-h-10 flex-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-ink-700 transition hover:bg-white hover:text-ink-900 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white sm:flex-none"
              >
                Copy
              </button>
              <button
                type="button"
                onClick={() => void handleExportPdf()}
                disabled={exporting}
                className="min-h-10 flex-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-ink-700 transition hover:bg-white hover:text-ink-900 disabled:opacity-60 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white sm:flex-none"
              >
                {exporting ? "Exporting…" : "Export"}
              </button>
            </div>
          </div>
        )}

        {sourceSummary && editing && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEditCancel}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-600 transition hover:bg-slate-100 hover:text-ink-900 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60 dark:bg-white dark:text-slate-900"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 scrollbar-thin sm:px-7 sm:py-7 lg:px-9 lg:py-8">
        {displayed && !editing && !translating && (
          <p className="ws-muted mb-6 text-xs leading-relaxed">
            This brief is generated from the uploaded PDF. It is not official Ministry of
            Education text and can miss or invent details. Use the original circular as the
            legal source.
            {circular.sourceUrl && (
              <>
                {" "}
                <a
                  href={circular.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-cyan-700 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300"
                >
                  Open on moe.gov.lk
                </a>
              </>
            )}
          </p>
        )}
        {sourceSummary?.mode === "fallback" && meta.llmError && !editing && (
          <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 dark:border-rose-400/20 dark:bg-rose-400/[0.06]">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-rose-800 dark:text-rose-300">
              AI summary unavailable
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-rose-900/80 dark:text-rose-100/85">
              {meta.llmError} A basic extractive summary is shown instead. Use Regenerate to retry.
            </p>
          </div>
        )}

        {meta.guardrailWarnings && meta.guardrailWarnings.length > 0 && !editing && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-400/20 dark:bg-amber-400/[0.06]">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-800 dark:text-amber-300">
              Review suggested
            </p>
            <ul className="mt-1.5 space-y-1">
              {meta.guardrailWarnings.map((w) => (
                <li key={w} className="text-sm leading-relaxed text-amber-900/80 dark:text-amber-100/85">
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!sourceSummary && !processing && circular.status !== "processing" && (
          <div className="flex min-h-[min(48vh,420px)] flex-col items-center justify-center px-4 text-center">
            <p className="font-display text-lg font-bold text-ink-900 dark:text-white">No summary yet</p>
            <p className="ws-muted mt-2 max-w-sm text-sm">
              {hasText
                ? "Review the extracted text first, then generate a brief. The original circular is the legal source."
                : "Extract text from the PDF, review it, then generate a summary."}
            </p>
          </div>
        )}

        {(processing || circular.status === "processing") && (
          <div className="flex min-h-[min(48vh,420px)] flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            <div className="text-center">
              <p className="text-sm font-semibold text-ink-900 dark:text-white">Building brief…</p>
              <p className="ws-muted mt-0.5 text-xs">Reading structure and key references</p>
            </div>
          </div>
        )}

        {(translating || (sourceSummary && viewLang !== sourceLang && !displayed && !editing)) && (
          <div className="flex min-h-[min(32vh,280px)] flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            <p className="text-sm font-semibold text-ink-900 dark:text-white">Translating brief…</p>
          </div>
        )}

        {displayed && !editing && !translating && !(processing || circular.status === "processing") && (
          <article className="w-full">
            <AnimateIn>
              <header className="border-b border-slate-200 pb-6 dark:border-white/[0.06]">
                <h2 className="max-w-4xl font-display text-xl font-bold leading-[1.25] tracking-tight text-ink-900 sm:text-2xl lg:text-[1.85rem] dark:text-white">
                  {displayed.title}
                </h2>

                {hasMeta && (
                  <dl className="mt-5 grid gap-x-8 gap-y-4 border-t border-slate-200 pt-5 dark:border-white/[0.05] sm:grid-cols-2 lg:grid-cols-4">
                    {displayed.circularNumber && (
                      <MetaCell label={labels.number} value={displayed.circularNumber} />
                    )}
                    {displayed.issuedDate && (
                      <MetaCell label={labels.issued} value={displayed.issuedDate} />
                    )}
                    {displayed.issuedBy && (
                      <MetaCell label={labels.issuedBy} value={displayed.issuedBy} />
                    )}
                    {displayed.effectiveDate && (
                      <MetaCell label={labels.effective} value={displayed.effectiveDate} />
                    )}
                    {displayed.targetAudience && (
                      <div className="min-w-0 sm:col-span-2 lg:col-span-4">
                        <dt className="ws-label">
                          {labels.audience}
                        </dt>
                        <dd className="mt-1 text-sm leading-relaxed text-ink-800 dark:text-slate-100">
                          {displayed.targetAudience}
                        </dd>
                      </div>
                    )}
                  </dl>
                )}
              </header>
            </AnimateIn>

            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,34%)] lg:items-start lg:gap-10">
              <div className="min-w-0 space-y-7">
                {displayed.sections.map((section, index) => (
                  <AnimateIn key={`${section.heading}-${index}`} delay={40 * (index + 1)}>
                    <section className="relative pl-12 sm:pl-14">
                      <span className="absolute left-0 top-0 font-display text-sm font-bold tabular-nums text-cyan-700 dark:text-cyan-400/80">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3 className="ws-label tracking-[0.16em]">
                        {section.heading}
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-[15px] leading-7 text-ink-800 sm:text-base sm:leading-7 dark:text-slate-100">
                        {section.content}
                      </p>
                    </section>
                  </AnimateIn>
                ))}
              </div>

              <aside className="min-w-0 space-y-6 lg:sticky lg:top-4">
                {displayed.actionItems.length > 0 && (
                  <AnimateIn delay={80}>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/15 dark:bg-white/[0.06] sm:p-5">
                      <h3 className="ws-label tracking-[0.16em]">
                        {labels.actions}
                      </h3>
                      <ol className="mt-4 space-y-3">
                        {displayed.actionItems.map((item, i) => (
                          <li key={item} className="flex gap-3 text-sm leading-relaxed text-ink-800 dark:text-slate-100">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-200 text-[10px] font-bold text-ink-500 dark:border-white/15 dark:text-slate-300">
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
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/15 dark:bg-white/[0.06] sm:p-5">
                      <h3 className="ws-label tracking-[0.16em]">
                        {labels.refs}
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
                            className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-ink-500 transition hover:text-ink-900 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400 dark:hover:text-white"
                          >
                            +{hiddenEntityCount} more
                          </button>
                        )}
                      </div>
                    </div>
                  </AnimateIn>
                )}

                {displayed.actionItems.length === 0 && circular.entities.length === 0 && (
                  <p className="ws-muted text-xs lg:pt-2">
                    Expand Source text above to review the original circular.
                  </p>
                )}
              </aside>
            </div>
          </article>
        )}

        {sourceSummary && editing && draftSummary && (
          <div className="w-full max-w-5xl space-y-5">
            <p className="ws-muted text-sm">
              Refine the brief before export. Changes stay on this document only.
            </p>

            <label className="block">
              <span className="ws-label mb-1.5 block tracking-widest">
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
                <span className="ws-label mb-1 block">
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
                <span className="ws-label mb-1 block">
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
                <span className="ws-label mb-1 block">
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
                <span className="ws-label mb-1 block">
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
                <span className="ws-label mb-1 block">
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
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="font-display text-xs font-bold text-cyan-700 dark:text-cyan-400/80">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="ws-label tracking-widest">
                      Section
                    </span>
                  </div>
                  <label className="mb-3 block">
                    <span className="ws-label mb-1.5 block tracking-widest">
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
                    <span className="ws-label mb-1.5 block tracking-widest">
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
              <span className="ws-label mb-1.5 block tracking-widest">
                Action items
              </span>
              <span className="ws-muted mb-2 block text-xs">One item per line</span>
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
