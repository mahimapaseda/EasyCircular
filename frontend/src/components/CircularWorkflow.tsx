"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ProcessingStatus from "@/components/ProcessingStatus";
import {
  displayText,
  extractCircularText,
  fetchCircular,
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
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

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
    setSaveMessage(null);
    try {
      const response = await extractCircularText(id);
      setCircular(response.circular);
      setDraftText(displayText(response.circular));
      if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed");
      await load();
    } finally {
      setExtracting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaveMessage(null);
    try {
      const updated = await saveCircularText(id, draftText);
      setCircular(updated);
      setDraftText(displayText(updated));
      setSaveMessage("Your edits were saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save text");
    } finally {
      setSaving(false);
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

  return (
    <>
      <ProcessingStatus currentStep={step} />

      {error && (
        <div className="mt-6 rounded-xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm text-coral-800 dark:border-coral-500/30 dark:bg-coral-500/10 dark:text-coral-200">
          {error}
        </div>
      )}

      {saveMessage && (
        <div className="mt-6 rounded-xl border border-mint-200 bg-mint-50 px-4 py-3 text-sm text-mint-800 dark:border-mint-500/30 dark:bg-mint-500/10 dark:text-mint-200">
          {saveMessage}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">
                Extracted text
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
              {(circular.status === "extracted" ||
                circular.status === "failed") && (
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
              {circular.processingMeta.ocrUsed ? " · OCR used" : ""}
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
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving || !hasText}
                  className="btn-primary"
                >
                  {saving ? "Saving…" : "Save edits"}
                </button>
                {circular.editedText && (
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

        <section className="card p-6">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Summary &amp; entities
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            The purpose, deadlines, and action items, with key entities
            highlighted.
          </p>
          <div className="mt-4 min-h-[280px] rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
            {circular.status === "extracted" && circular.editedText ? (
              <p>Text reviewed and saved. Summarization arrives in Phase 3.</p>
            ) : circular.status === "extracted" ? (
              <p>
                Review and save the extracted text first. AI summarization will be
                available in the next phase.
              </p>
            ) : (
              <p>The summary will appear here after the circular is processed.</p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
