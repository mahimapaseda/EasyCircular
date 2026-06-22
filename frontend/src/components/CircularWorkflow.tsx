"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import EntityHighlight from "@/components/EntityHighlight";
import SummaryPanel from "@/components/SummaryPanel";
import WorkflowLayout from "@/components/workflow/WorkflowLayout";
import { extractionConfidence } from "@/components/workspace/workspaceUtils";
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

type TextView = "highlights" | "editor";

export default function CircularWorkflow({ id }: CircularWorkflowProps) {
  const [circular, setCircular] = useState<Circular | null>(null);
  const [draftText, setDraftText] = useState("");
  const [textView, setTextView] = useState<TextView>("editor");
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
      if (data.entities.length > 0) setTextView("highlights");
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
      if (result.circular.entities.length > 0) setTextView("highlights");
      showToast(
        result.cached
          ? "Loaded a cached summary for identical text."
          : "Summary generated successfully.",
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
        <p className="text-sm font-semibold text-ink-600 dark:text-ink-400">Loading workspace…</p>
      </div>
    );
  }

  if (!circular) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-bold text-rose-700 dark:text-rose-400">{error || "Circular not found"}</p>
        <Link href="/circulars" className="btn-secondary">← Back to library</Link>
      </div>
    );
  }

  const step = workflowStep(circular);
  const hasText = Boolean(displayText(circular));
  const extractionError = circular.processingMeta.extractionError;
  const sourceText = displayText(circular);
  const confidence = extractionConfidence(circular);
  const canProcess =
    circular.status === "extracted" ||
    circular.status === "completed" ||
    circular.status === "failed";
  const hasEntities = circular.entities.length > 0;

  return (
    <WorkflowLayout circular={circular} currentStep={step}>
      {error && (
        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 sm:flex-row sm:items-center sm:justify-between dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-100">
          <p className="font-semibold">{error}</p>
          <button type="button" onClick={() => void load()} className="btn-secondary shrink-0 text-xs">
            Retry
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className="space-y-4">
          {/* Awaiting extraction */}
          {circular.status === "uploaded" && !extracting && (
            <div className="ws-card border-2 border-dashed border-brand-300 bg-brand-50/40 p-10 text-center dark:border-brand-800 dark:bg-brand-950/20">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-ink-900">
                <svg className="h-8 w-8 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A3.375 3.375 0 006.75 21h10.5a3.375 3.375 0 003.375-3.375V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <p className="text-lg font-bold text-ink-900 dark:text-white">Drag &amp; Drop PDF Document</p>
              <p className="mt-1 text-sm text-ink-500">
                <span className="font-medium text-ink-700 dark:text-ink-300">{circular.originalFilename}</span>
                {" "}is ready · max 20 MB
              </p>
              <button type="button" onClick={() => void handleExtract()} className="btn-primary mt-6">
                Extract text from PDF
              </button>
            </div>
          )}

          {extracting && (
            <div className="ws-card p-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
                <div>
                  <p className="font-bold text-ink-900 dark:text-white">Extracting document text…</p>
                  <p className="text-sm text-ink-500">pdfplumber → PyMuPDF → Tesseract OCR if needed</p>
                </div>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                <div className="h-full w-2/5 animate-pulsebar rounded-full bg-brand-600" />
              </div>
            </div>
          )}

          {/* OCR Extraction Data card */}
          {(hasText || circular.status !== "uploaded") && !extracting && (
            <div className="ws-card overflow-hidden">
              <div className="ws-card-header">
                <div>
                  <h3 className="text-sm font-bold text-ink-900 dark:text-white">OCR Extraction Data</h3>
                  <p className="text-xs text-ink-500">Review and correct before summarization</p>
                </div>
                <div className="flex items-center gap-2">
                  {confidence !== null && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Confidence {confidence}%
                    </span>
                  )}
                  <button type="button" onClick={() => void handleExtract()} className="btn-secondary text-xs py-1.5">
                    Re-extract
                  </button>
                </div>
              </div>

              {circular.status === "failed" && !hasText && extractionError && (
                <div className="mx-5 mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200">
                  {extractionError}
                </div>
              )}

              {/* View toggle */}
              {hasEntities && (
                <div className="border-b border-ink-100 px-5 py-3 dark:border-ink-800">
                  <div className="ws-segment">
                    <button
                      type="button"
                      onClick={() => setTextView("highlights")}
                      className={`ws-segment-btn ${textView === "highlights" ? "ws-segment-active" : "ws-segment-idle"}`}
                    >
                      Highlights ({circular.entities.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextView("editor")}
                      className={`ws-segment-btn ${textView === "editor" ? "ws-segment-active" : "ws-segment-idle"}`}
                    >
                      Editor
                    </button>
                  </div>
                </div>
              )}

              <div className="p-5">
                {textView === "highlights" && hasEntities ? (
                  <div className="max-h-[340px] overflow-y-auto scrollbar-thin rounded-lg border border-ink-200 bg-[#f8fafc] p-5 dark:border-ink-700 dark:bg-ink-950/60">
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
                    className="input-field min-h-[280px] resize-y font-mono text-[13px] leading-relaxed"
                  />
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-4 dark:border-ink-800">
                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={saving || !hasText || textView === "highlights"}
                    className="btn-secondary text-sm"
                  >
                    {saving ? "Saving…" : "Save edits"}
                  </button>
                  {circular.editedText && textView === "editor" && (
                    <button
                      type="button"
                      onClick={() => setDraftText(circular.extractedText ?? "")}
                      className="btn-ghost text-sm"
                    >
                      Reset to extracted
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        </section>

        <aside className="space-y-4">
          <SummaryPanel
            circular={circular}
            processing={processing}
            onExport={(format) =>
              showToast(`Summary exported as ${format.toUpperCase()}.`, "success")
            }
          />
          {canProcess && hasText && (
            <button
              type="button"
              onClick={() => void handleProcess()}
              disabled={processing || circular.status === "processing"}
              className="btn-primary flex w-full items-center justify-center gap-2 py-3.5 text-base font-semibold shadow-md shadow-brand-600/20"
            >
              {processing || circular.status === "processing" ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating AI Summary…
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Generate AI Summary
                </>
              )}
            </button>
          )}
        </aside>
      </div>
    </WorkflowLayout>
  );
}
