"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import AuthButtonGroup from "@/components/AuthButtonGroup";
import { useAuth } from "@/context/AuthContext";
import { uploadCircular } from "@/lib/circulars";

const MAX_SIZE = 20 * 1024 * 1024;

export const UPLOAD_RETURN_TO = "/#upload";

type UploadDropzoneProps = {
  disabled?: boolean;
};

export default function UploadDropzone({ disabled = false }: UploadDropzoneProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      if (disabled || uploading || !user) return;

      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        setError("Please choose a PDF file.");
        return;
      }

      if (file.size > MAX_SIZE) {
        setError("File exceeds the 20 MB limit.");
        return;
      }

      setError(null);
      setUploading(true);

      try {
        const circular = await uploadCircular(file);
        router.push(`/circular/${circular.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setUploading(false);
      }
    },
    [disabled, uploading, router, user],
  );

  const onFile = useCallback(
    (file: File | undefined) => {
      if (!file || disabled || uploading || !user) return;
      void handleUpload(file);
    },
    [disabled, uploading, handleUpload, user],
  );

  if (loading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <p className="text-sm font-medium text-white/40">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-white/15 bg-white/5 p-8 text-center backdrop-blur-xl sm:p-10">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-xl shadow-blue-500/20">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <h3 className="text-xl font-black text-white">Sign in to upload</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">
          Create a free account or sign in first, then you can upload your Ministry of Education circular.
        </p>
        <div className="mt-6 flex justify-center">
          <AuthButtonGroup returnTo={UPLOAD_RETURN_TO} />
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      <label
        htmlFor="circular-upload"
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !uploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          onFile(e.dataTransfer.files[0]);
        }}
        className={`relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed px-8 py-14 text-center transition-all duration-300 ${
          dragOver
            ? "border-cyan-400/60 bg-cyan-400/10"
            : uploading
            ? "border-purple-400/40 bg-purple-400/10"
            : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
        } ${disabled || uploading ? "cursor-not-allowed opacity-80" : ""}`}
      >
        {/* Icon */}
        <div
          className={`relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br transition-all duration-300 ${
            uploading
              ? "from-purple-400 to-fuchsia-500 shadow-lg shadow-purple-500/30"
              : "from-cyan-400 to-blue-600 shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/45"
          }`}
        >
          {uploading ? (
            <svg className="h-8 w-8 animate-spin text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : dragOver ? (
            <svg className="h-8 w-8 animate-bounce text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A3.375 3.375 0 006.75 21h10.5a3.375 3.375 0 003.375-3.375V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          ) : (
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A3.375 3.375 0 006.75 21h10.5a3.375 3.375 0 003.375-3.375V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          )}
        </div>

        <p className="font-display text-xl font-bold tracking-tight text-white">
          {uploading ? "Uploading your circular…" : dragOver ? "Drop it here!" : "Drop PDF or browse"}
        </p>
        <p className="mt-2 text-sm font-medium text-slate-300">
          {uploading
            ? "Please wait while we store your document"
            : "Ministry of Education circulars · PDF · max 20 MB"}
        </p>

        {!uploading && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {["Sinhala", "Tamil", "English"].map((lang) => (
              <span
                key={lang}
                className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-bold text-white/70"
              >
                {lang}
              </span>
            ))}
            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-bold text-cyan-300">
              OCR supported
            </span>
          </div>
        )}

        {!uploading && (
          <span className="btn-primary pointer-events-none mt-6">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Choose file
          </span>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-2.5 text-sm font-semibold text-rose-300">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        <input
          id="circular-upload"
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          disabled={disabled || uploading}
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </label>
    </div>
  );
}
