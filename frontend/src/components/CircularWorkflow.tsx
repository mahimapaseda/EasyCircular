"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import EntityHighlight from "@/components/EntityHighlight";
import SummaryPanel from "@/components/SummaryPanel";
import WorkflowLayout from "@/components/workflow/WorkflowLayout";
import { useToast } from "@/context/ToastContext";
import {
  displayText,
  extractCircularText,
  fetchCircular,
  processCircular,
  saveCircularText,
  workflowStep,
  type Circular,
} from "@/lib/circulars";

type CircularWorkflowProps = {
  id: string;
};

export default function CircularWorkflow({ id }: CircularWorkflowProps) {
  const [circular, setCircular] = useState<Circular | null>(null);
  const [draftText, setDraftText] = useState("");
  const [showHighlights, setShowHighlights] = useState(true);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCircular(id);
      setCircular(data);
      setDraftText(displayText(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load circular");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleExtract() {
    setExtracting(true);
    setError(null);
    try {
      const response = await extractCircularText(id);
      setCircular(response.circular);
      setDraftText(displayText(response.circular));
      if (response.error) {
        setError(response.error);
        showToast(response.error, "error");
      } else {
        showToast("Text extracted successfully.", "success");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Extraction failed";
      setError(message);
      showToast(message, "error");
      await load();
    } finally {
      setExtracting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await saveCircularText(id, draftText);
      setCircular(updated);
      setDraftText(displayText(updated));
      showToast("Your edits were saved.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save text";
      setError(message);
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleProcess() {
    setProcessing(true);
    setError(null);
    try {
      const result = await processCircular(id);
      setCircular(result.circular);
      setDraftText(displayText(result.circular));
      showToast(
        result.cached
          ? "⚡ Loaded a cached summary for identical text."
          : "✨ Summary generated successfully.",
        "success",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Processing failed";
      setError(message);
      showToast(message, "error");
      await load();
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-brand-100 bg-gradient-to-br from-brand-50/50 to-fuchsia-50/30 dark:border-ink-800 dark:from-ink-900 dark:to-fuchsia-950/10">
        <div className="relative flex h-14 w-14 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-brand-400/30" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-600">
            <svg className="h-7 w-7 animate-spin text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </div>
        </div>
        <div className="text-center">
          <p className="font-bold text-ink-700 dark:text-ink-200">Loading circular…</p>
          <p className="text-xs font-medium text-ink-400 dark:text-ink-500">Fetching document from server</p>
        </div>
      </div>
    );
  }

  if (!circular) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50/60 p-10 text-center dark:border-rose-900/60 dark:from-rose-950/30 dark:to-pink-950/20">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/50">
          <svg className="h-8 w-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <div>
          <p className="text-lg font-black text-rose-800 dark:text-rose-300">{error || "Circular not found"}</p>
          <p className="mt-1 text-sm text-rose-600/70 dark:text-rose-400/60">This document may have been deleted or you may not have access.</p>
        </div>
        <Link href="/circulars" className="btn-secondary">
          ← Back to library
        </Link>
      </div>
    );
  }

  const step = workflowStep(circular);
  const hasText = Boolean(displayText(circular));
  const extractionError = circular.processingMeta.extractionError;
  const sourceText = displayText(circular);

  return (
    <WorkflowLayout circular={circular} currentStep={step}>
      {/* Error banner */}
      {error && (
        <div className="flex flex-col gap-3 rounded-xl border-2 border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50/60 px-4 py-3.5 text-sm text-rose-900 dark:border-rose-800/60 dark:from-rose-950/30 dark:to-pink-950/20 dark:text-rose-100 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="font-semibold">{error}</p>
          </div>
          <button type="button" onClick={() => void load()} className="btn-secondary shrink-0 text-xs">
            Retry
          </button>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        {/* ── Source document panel ──────────────────────────────── */}
        <section className="flex flex-col rounded-3xl border border-brand-200/50 bg-white/70 shadow-xl shadow-brand-900/5 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-950/50">
          {/* Panel header */}
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-brand-100/50 bg-gradient-to-r from-brand-50/50 to-transparent p-5 dark:border-ink-800/50 dark:from-brand-950/20">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 shadow-md shadow-brand-500/20">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-black text-ink-900 dark:text-white">Source document</h2>
                <p className="text-xs font-semibold text-ink-500 dark:text-ink-400">
                  {circular.entities.length > 0 && showHighlights
                    ? `${circular.entities.length} entities highlighted`
                    : "Review and correct extracted text"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {circular.status === "uploaded" ? (
                <button
                  type="button"
                  onClick={() => void handleExtract()}
                  disabled={extracting}
                  className="btn-primary rounded-full px-4 text-sm font-bold shadow-sm"
                >
                  {extracting ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                      Extracting…
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Extract text
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleExtract()}
                  disabled={extracting}
                  className="btn-secondary rounded-full px-4 text-sm font-bold"
                >
                  {extracting ? "Re-extracting…" : "Re-extract"}
                </button>
              )}
            </div>
          </div>
          
          <div className="flex-1 p-5">

          {/* States */}
          {circular.status === "uploaded" && !extracting && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border-2 border-brand-100 bg-gradient-to-br from-brand-50 to-fuchsia-50/40 p-4 dark:border-brand-800/50 dark:from-brand-950/30 dark:to-fuchsia-950/20">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-950/50">
                <svg className="h-5 w-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A3.375 3.375 0 006.75 21h10.5a3.375 3.375 0 003.375-3.375V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-brand-800 dark:text-brand-200">PDF uploaded successfully</p>
                <p className="mt-0.5 text-sm text-brand-600/80 dark:text-brand-400/70">
                  Click <strong>Extract text</strong> to read and parse the document content.
                </p>
              </div>
            </div>
          )}

          {extracting && (
            <div className="mt-5 overflow-hidden rounded-xl border-2 border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-violet-50/60 dark:border-fuchsia-800/50 dark:from-fuchsia-950/30 dark:to-violet-950/20">
              <div className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 shadow-md shadow-fuchsia-500/30">
                  <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-fuchsia-900 dark:text-fuchsia-200">Parsing document…</p>
                  <p className="text-xs text-fuchsia-600/80 dark:text-fuchsia-400/60">Scanned documents may take longer (OCR processing)</p>
                </div>
              </div>
              <div className="relative h-1.5 bg-fuchsia-100 dark:bg-fuchsia-950/40">
                <div className="absolute inset-y-0 w-1/3 animate-pulsebar rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500" />
              </div>
            </div>
          )}

          {circular.status === "failed" && !hasText && extractionError && (
            <div className="mt-5 rounded-xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50/60 p-4 dark:border-rose-800/50 dark:from-rose-950/30 dark:to-pink-950/20">
              <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">{extractionError}</p>
            </div>
          )}

          {(hasText || circular.status !== "uploaded") && !extracting && (
            <>
              {circular.entities.length > 0 && (
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowHighlights((v) => !v)}
                    className={`btn-ghost text-xs ${showHighlights ? "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-300" : ""}`}
                  >
                    {showHighlights ? (
                      <>
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        Switch to editor
                      </>
                    ) : (
                      <>
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Show highlights
                      </>
                    )}
                  </button>
                </div>
              )}

              {showHighlights && circular.entities.length > 0 ? (
                <div className="mt-4 max-h-[480px] overflow-y-auto scrollbar-thin rounded-xl border-2 border-brand-100 bg-ink-50/50 p-4 dark:border-ink-700 dark:bg-ink-950/40">
                  <EntityHighlight text={sourceText} entities={circular.entities} />
                </div>
              ) : (
                <textarea
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  disabled={!hasText && circular.status === "failed"}
                  placeholder={
                    circular.status === "failed"
                      ? "No text could be extracted. Try re-extract or upload a different PDF."
                      : "Extracted text will appear here…"
                  }
                  className="input-field mt-4 min-h-[320px] resize-y font-mono text-xs leading-relaxed"
                />
              )}

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving || !hasText || showHighlights}
                  className="btn-primary text-sm"
                >
                  {saving ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                      Saving…
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3" />
                      </svg>
                      Save edits
                    </>
                  )}
                </button>
                {circular.editedText && !showHighlights && (
                  <button
                    type="button"
                    onClick={() => setDraftText(circular.extractedText ?? "")}
                    className="btn-secondary text-sm"
                  >
                    Reset to extracted
                  </button>
                )}
              </div>
            </>
          )}
          </div>
        </section>

        {/* ── Summary panel ──────────────────────────────────────── */}
        <SummaryPanel
          circular={circular}
          processing={processing}
          onProcess={() => void handleProcess()}
          onExport={(format) =>
            showToast(`Summary exported as ${format.toUpperCase()}.`, "success")
          }
        />
      </div>
    </WorkflowLayout>
  );
}
