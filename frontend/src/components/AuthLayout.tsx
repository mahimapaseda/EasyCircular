import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel – decorative gradient */}
      <div className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between bg-gradient-to-br from-brand-600 via-fuchsia-600 to-violet-700">
        {/* Mesh background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-dots opacity-20" />
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-16 h-80 w-80 rounded-full bg-fuchsia-300/20 blur-3xl" />
          <div className="pointer-events-none absolute left-1/3 top-1/2 h-64 w-64 rounded-full bg-violet-300/15 blur-3xl" />
        </div>

        {/* Top logo */}
        <div className="relative px-10 pt-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-lg ring-1 ring-white/30 transition-transform group-hover:scale-105">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-xl font-black text-white tracking-tight">EasyCircular</span>
          </Link>
        </div>

        {/* Center copy */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-10 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 backdrop-blur-sm ring-1 ring-white/25 shadow-xl">
            <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-white leading-tight">
            Turn circulars into <br />
            <span className="text-amber-300">clear insights</span>
          </h2>
          <p className="mt-4 max-w-xs text-sm font-medium leading-relaxed text-white/70">
            AI-powered summaries, entity highlighting, and human review — all in one workflow.
          </p>

          {/* Feature chips */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {["Smart OCR", "NER Highlights", "AI Summaries", "Human Review"].map((feat) => (
              <span
                key={feat}
                className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white/90 ring-1 ring-white/20 backdrop-blur-sm"
              >
                {feat}
              </span>
            ))}
          </div>

          {/* Quote */}
          <div className="mt-10 rounded-2xl bg-white/10 p-5 ring-1 ring-white/20 backdrop-blur-sm text-left max-w-sm">
            <p className="text-sm font-medium text-white/80 leading-relaxed">
              &ldquo;This tool saves us hours every time a new circular arrives from the ministry.&rdquo;
            </p>
            <p className="mt-3 text-xs font-bold text-white/60">
              — School Principal, Western Province
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="relative px-10 pb-8">
          <p className="text-xs font-medium text-white/40">
            University of Bedfordshire · Y3 Dissertation · Phase 4
          </p>
        </div>
      </div>

      {/* Right panel – form */}
      <div className="relative flex w-full flex-col bg-gradient-to-b from-brand-50/30 to-white dark:from-ink-950 dark:to-ink-950 lg:w-1/2">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-5 sm:px-10">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-600 text-white shadow-md shadow-brand-500/30 transition-transform group-hover:scale-105">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-base font-black text-ink-900 dark:text-white">EasyCircular</span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Form area */}
        <div className="flex flex-1 items-center justify-center px-6 pb-10 sm:px-10">
          <div className="w-full max-w-md animate-fade-up">
            {/* Form card */}
            <div className="rounded-3xl border-2 border-brand-100 bg-white p-8 shadow-panel dark:border-ink-800 dark:bg-ink-900">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
