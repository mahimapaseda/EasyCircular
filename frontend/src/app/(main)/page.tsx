"use client";

import Link from "next/link";
import HealthStatus from "@/components/HealthStatus";
import UploadDropzone from "@/components/UploadDropzone";
import WorkflowStepper from "@/components/workflow/WorkflowStepper";

const FEATURES = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
    color: "from-brand-500 to-brand-600",
    bg: "from-brand-50 to-brand-100/50",
    border: "border-brand-200/60",
    title: "Smart PDF Extraction",
    desc: "Dual-engine parsing with OCR fallback for Sinhala, Tamil & English scanned documents.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    color: "from-fuchsia-500 to-violet-600",
    bg: "from-fuchsia-50 to-violet-50",
    border: "border-fuchsia-200/60",
    title: "AI-Powered Summaries",
    desc: "LangChain map-reduce summaries using GPT-4o or Gemini with anti-hallucination guardrails.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
    color: "from-amber-400 to-orange-500",
    bg: "from-amber-50 to-orange-50/60",
    border: "border-amber-200/60",
    title: "Entity Recognition",
    desc: "Automatically highlights dates, legal references, organizations and persons in context.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: "from-emerald-500 to-teal-600",
    bg: "from-emerald-50 to-teal-50/60",
    border: "border-emerald-200/60",
    title: "Human-in-the-Loop",
    desc: "Edit extracted text before AI processing. Every output is reviewed, never blindly trusted.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-mesh">
      {/* ─── Hero ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-hero bg-dots dark:bg-gradient-hero-dark">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl dark:bg-brand-600/10" />
        <div className="pointer-events-none absolute -right-32 top-0 h-80 w-80 rounded-full bg-fuchsia-400/15 blur-3xl dark:bg-fuchsia-600/8" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-amber-300/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          {/* Left: Copy */}
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200/60 bg-white/80 px-3 py-1.5 text-xs font-bold text-brand-600 shadow-sm backdrop-blur dark:border-brand-700/40 dark:bg-ink-900/60 dark:text-brand-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Sri Lanka Ministry of Education — AI Assistant
            </div>

            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-ink-900 dark:text-white sm:text-5xl lg:text-6xl">
              Turn long circulars into{" "}
              <span className="text-gradient">clear, actionable</span>{" "}
              summaries
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-600 dark:text-ink-300">
              Upload an official school circular, verify extracted text, and
              generate a structured summary with dates, legal references, and
              action items — with{" "}
              <span className="font-semibold text-brand-600 dark:text-brand-400">
                human review at every step.
              </span>
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#upload" className="btn-primary text-base px-6 py-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A3.375 3.375 0 006.75 21h10.5a3.375 3.375 0 003.375-3.375V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                Upload circular
              </Link>
              <Link href="/circulars" className="btn-secondary text-base px-6 py-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Open library
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-10 flex flex-wrap gap-6">
              {[
                { val: "≥90%", label: "PDF parse rate" },
                { val: "≥80%", label: "Entity precision" },
                { val: "<60s", label: "Processing time" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-black text-gradient">{stat.val}</p>
                  <p className="text-xs font-semibold text-ink-500 dark:text-ink-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: System status */}
          <div className="animate-slide-in-right">
            <div className="panel-gradient overflow-hidden">
              <div className="flex items-center gap-3 border-b border-brand-100 pb-4 dark:border-ink-800">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md shadow-emerald-500/30">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-black text-ink-900 dark:text-white">System Status</h2>
                  <p className="text-xs font-medium text-ink-500 dark:text-ink-400">
                    API · Database · AI pipeline
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <HealthStatus />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <p className="section-label">Why EasyCircular</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-ink-900 dark:text-white sm:text-4xl">
            Everything you need, nothing you don&apos;t
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className={`panel-hover animate-fade-up rounded-2xl border ${feature.border} bg-gradient-to-br ${feature.bg} p-5 dark:border-ink-800 dark:from-ink-900 dark:to-ink-800`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div
                className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} text-white shadow-md`}
              >
                {feature.icon}
              </div>
              <h3 className="font-black text-ink-900 dark:text-white">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600 dark:text-ink-400">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Workflow stepper ─────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="mb-8 text-center">
          <p className="section-label">How it works</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-ink-900 dark:text-white">
            A guided four-step pipeline
          </h2>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
            Designed for school administrators — no technical knowledge required.
          </p>
        </div>
        <WorkflowStepper currentStep={1} />
      </section>

      {/* ─── Upload zone ──────────────────────────────────────────── */}
      <section
        id="upload"
        className="relative border-t border-brand-100 bg-gradient-to-b from-brand-50/60 via-white to-fuchsia-50/30 dark:border-ink-800 dark:from-brand-950/20 dark:via-ink-950 dark:to-fuchsia-950/10"
      >
        {/* Top decoration */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400 to-transparent opacity-50" />

        <div className="mx-auto max-w-3xl scroll-mt-24 px-4 py-14 sm:px-6">
          <div className="mb-8 text-center">
            <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-600 shadow-lg shadow-brand-500/30">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A3.375 3.375 0 006.75 21h10.5a3.375 3.375 0 003.375-3.375V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-ink-900 dark:text-white">
              Upload a circular
            </h2>
            <p className="mt-2 text-sm font-medium text-ink-500 dark:text-ink-400">
              PDF only · up to 20 MB · digital or scanned documents supported (Sinhala + Tamil + English)
            </p>
          </div>
          <UploadDropzone />
        </div>
      </section>
    </div>
  );
}
