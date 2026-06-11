"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import EntityHighlight from "@/components/EntityHighlight";
import ProcessingStatus from "@/components/ProcessingStatus";
import SummaryPanel from "@/components/SummaryPanel";
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
      <div className="card flex min-h-[240px] items-center justify-center p-8">
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading circular…</p>
      </div>
    );
  }

  if (!circular) {
    return (
      <div className="card p-8 text-center">
        <p className="text-coral-600 dark:text-coral-400">
          {error || "Circular not found"}
        </p>
        <Link href="/circulars" className="btn-secondary mt-4 inline-flex">
          Back to circulars
        </Link>
      </div>
    );
  }

  const step = workflowStep(circular);
  const hasText = Boolean(displayText(circular));
  const extractionError = circular.processingMeta.extractionError;
  const sourceText = displayText(circular);

  return (
    <>
      <ProcessingStatus currentStep={step} />

      {error && (
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm text-coral-800 dark:border-coral-500/30 dark:bg-coral-500/10 dark:text-coral-200 sm:flex-row sm:items-center sm:justify-between">
          <p>{error}</p>
          <button type="button" onClick={() => void load()} className="btn-secondary shrink-0">
            Retry
          </button>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">
                {circular.entities.length > 0 && showHighlights
                  ? "Source text (highlighted)"
                  : "Extracted text"}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {circular.originalFilename}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {circular.status === "uploaded" && (
                <button
                  type="button"
                  onClick={() => void handleExtract()}
                  disabled={extracting}
                  className="btn-primary"
                >
                  {extracting ? "Extracting…" : "Extract text"}
                </button>
              )}
              {(circular.status === "uploaded" ||
                circular.status === "extracted" ||
                circular.status === "failed" ||
                circular.status === "completed") &&
                circular.status !== "uploaded" && (
                  <button
                    type="button"
                    onClick={() => void handleExtract()}
                    disabled={extracting}
                    className="btn-secondary"
                  >
                    {extracting ? "Re-extracting…" : "Re-extract"}
                  </button>
                )}
            </div>
          </div>

          {circular.processingMeta.pageCount > 0 && (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {circular.processingMeta.pageCount} page
              {circular.processingMeta.pageCount === 1 ? "" : "s"}
              {circular.processingMeta.ocrUsed
                ? ` · OCR used${circular.processingMeta.ocrLang ? ` (${circular.processingMeta.ocrLang})` : ""}`
                : ""}
            </p>
          )}

          {circular.status === "uploaded" && !extracting && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
              PDF uploaded. Click <strong>Extract text</strong> to read the document.
            </div>
          )}

          {extracting && (
            <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-200">
              Reading the PDF… this may take a moment for scanned documents.
            </div>
          )}

          {circular.status === "failed" && !hasText && extractionError && (
            <div className="mt-4 rounded-xl border border-coral-200 bg-coral-50 p-4 text-sm text-coral-800 dark:border-coral-500/30 dark:bg-coral-500/10 dark:text-coral-200">
              {extractionError}
            </div>
          )}

          {(hasText || circular.status !== "uploaded") && !extracting && (
            <>
              {circular.entities.length > 0 && (
                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowHighlights((v) => !v)}
                    className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
                  >
                    {showHighlights ? "Edit text" : "Show highlights"}
                  </button>
                </div>
              )}

              {showHighlights && circular.entities.length > 0 ? (
                <div className="mt-4 max-h-[420px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
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
                  className="mt-4 min-h-[280px] w-full resize-y rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              )}

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving || !hasText || showHighlights}
                  className="btn-primary"
                >
                  {saving ? "Saving…" : "Save edits"}
                </button>
                {circular.editedText && !showHighlights && (
                  <button
                    type="button"
                    onClick={() => setDraftText(circular.extractedText)}
                    className="btn-secondary"
                  >
                    Reset to extracted text
                  </button>
                )}
              </div>
            </>
          )}
        </section>

        <SummaryPanel
          circular={circular}
          processing={processing}
          onProcess={() => void handleProcess()}
          onExport={(format) =>
            showToast(`Summary exported as ${format.toUpperCase()}.`, "success")
          }
        />
      </div>
    </>
  );
}
