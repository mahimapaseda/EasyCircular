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
      <div className="panel flex min-h-[280px] items-center justify-center">
        <p className="text-sm text-ink-500 dark:text-ink-400">Loading circular…</p>
      </div>
    );
  }

  if (!circular) {
    return (
      <div className="panel p-8 text-center">
        <p className="text-rose-600 dark:text-rose-400">
          {error || "Circular not found"}
        </p>
        <Link href="/circulars" className="btn-secondary mt-4 inline-flex">
          Back to library
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
      {error && (
        <div className="flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-100 sm:flex-row sm:items-center sm:justify-between">
          <p>{error}</p>
          <button type="button" onClick={() => void load()} className="btn-secondary shrink-0">
            Retry
          </button>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="panel">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-ink-900 dark:text-white">
                Source document
              </h2>
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                {circular.entities.length > 0 && showHighlights
                  ? "Highlighted entities in extracted text"
                  : "Review and correct extracted text before summarizing"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {circular.status === "uploaded" ? (
                <button
                  type="button"
                  onClick={() => void handleExtract()}
                  disabled={extracting}
                  className="btn-primary"
                >
                  {extracting ? "Extracting…" : "Extract text"}
                </button>
              ) : (
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

          {circular.status === "uploaded" && !extracting && (
            <div className="mt-4 rounded-lg border border-ink-200 bg-ink-50 p-4 text-sm text-ink-600 dark:border-ink-700 dark:bg-ink-950/40 dark:text-ink-400">
              PDF uploaded. Run extraction to read the document content.
            </div>
          )}

          {extracting && (
            <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900 dark:border-brand-700 dark:bg-brand-950/30 dark:text-brand-100">
              Reading the PDF… scanned documents may take longer.
            </div>
          )}

          {circular.status === "failed" && !hasText && extractionError && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-100">
              {extractionError}
            </div>
          )}

          {(hasText || circular.status !== "uploaded") && !extracting && (
            <>
              {circular.entities.length > 0 && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setShowHighlights((v) => !v)}
                    className="btn-ghost text-xs"
                  >
                    {showHighlights ? "Switch to editor" : "Show highlights"}
                  </button>
                </div>
              )}

              {showHighlights && circular.entities.length > 0 ? (
                <div className="mt-4 max-h-[480px] overflow-y-auto rounded-lg border border-ink-200 bg-ink-50/50 p-4 dark:border-ink-700 dark:bg-ink-950/40">
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
                  className="input-field mt-4 min-h-[320px] resize-y leading-relaxed"
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
                    Reset to extracted
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
    </WorkflowLayout>
  );
}
