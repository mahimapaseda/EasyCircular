"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import { WORKFLOW_STEPS } from "@/lib/contracts";
import { formatRelativeTime, wordCount } from "@/components/workspace/workspaceUtils";
import type { Circular } from "@/lib/circulars";

type WorkflowLayoutProps = {
  circular: Circular;
  currentStep: number;
  children: ReactNode;
  actions?: ReactNode;
};

export default function WorkflowLayout({
  circular,
  currentStep,
  children,
  actions,
}: WorkflowLayoutProps) {
  const words = wordCount(circular);
  const clamped = Math.min(Math.max(currentStep, 1), WORKFLOW_STEPS.length);

  const stats = [
    circular.processingMeta.pageCount > 0 && `${circular.processingMeta.pageCount} pages`,
    words > 0 && `${words.toLocaleString()} words`,
    circular.entities.length > 0 && `${circular.entities.length} entities`,
  ].filter(Boolean);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/50 backdrop-blur-2xl">
        <div className="flex items-start justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <nav className="flex items-center gap-1.5 text-xs text-slate-400">
              <Link href="/circulars" className="font-medium text-cyan-400 hover:text-cyan-300">
                Documents
              </Link>
              <span>/</span>
              <span className="truncate">{circular.originalFilename}</span>
            </nav>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-bold text-white sm:text-xl">
                {circular.originalFilename}
              </h1>
              <StatusBadge status={circular.status} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
              <span>Updated {formatRelativeTime(circular.updatedAt)}</span>
              {stats.length > 0 && (
                <>
                  <span className="hidden sm:inline">·</span>
                  <span>{stats.join(" · ")}</span>
                </>
              )}
            </div>
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>

        {/* Workflow steps */}
        <div className="flex gap-1 overflow-x-auto border-t border-white/5 px-4 py-2.5 sm:px-6">
          {WORKFLOW_STEPS.map((step) => {
            const done = clamped > step.id;
            const active = clamped === step.id;
            return (
              <span
                key={step.key}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                  active
                    ? "bg-white text-slate-900 shadow-sm"
                    : done
                      ? "border border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                      : "border border-white/10 bg-white/5 text-slate-500"
                }`}
              >
                {done && !active && (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {step.label}
              </span>
            );
          })}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
