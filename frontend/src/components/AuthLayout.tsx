"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

const LiquidChrome = dynamic(() => import("@/components/LiquidChrome"), {
  ssr: false,
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen">
      {/* Full-screen LiquidChrome background */}
      <div className="fixed inset-0 -z-10">
        <LiquidChrome
          baseColor={[0.04, 0.12, 0.35]}
          speed={0.25}
          amplitude={0.5}
          frequencyX={2.5}
          frequencyY={1.8}
          interactive={true}
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Left panel – branding */}
      <div className="relative hidden w-1/2 overflow-hidden border-r border-white/10 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
        <div className="pointer-events-none absolute -left-20 top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-[80px]" />
        <div className="pointer-events-none absolute bottom-20 right-10 h-72 w-72 rounded-full bg-blue-600/10 blur-[100px]" />

        {/* Top logo */}
        <div className="relative px-10 pt-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-blue-500/25 transition-transform group-hover:scale-105">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-white">
              Easy<span className="text-cyan-300">Circular</span>
            </span>
          </Link>
        </div>

        {/* Center copy */}
        <div className="relative flex flex-1 flex-col items-center justify-center px-10 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/15 bg-white/5 shadow-xl backdrop-blur-xl">
            <svg className="h-10 w-10 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black leading-tight text-white">
            Turn circulars into <br />
            <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              clear insights
            </span>
          </h2>
          <p className="mt-4 max-w-xs text-sm font-medium leading-relaxed text-slate-300">
            AI-powered summaries, entity highlighting, and human review — all in one workflow.
          </p>

          {/* Feature chips */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {["Smart OCR", "NER Highlights", "AI Summaries", "Human Review"].map((feat) => (
              <span
                key={feat}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200 backdrop-blur-sm"
              >
                {feat}
              </span>
            ))}
          </div>

          {/* Quote */}
          <div className="mt-10 max-w-sm rounded-2xl border border-white/10 bg-black/30 p-5 text-left backdrop-blur-xl">
            <p className="text-sm font-medium leading-relaxed text-slate-200">
              &ldquo;This tool saves us hours every time a new circular arrives from the ministry.&rdquo;
            </p>
            <p className="mt-3 text-xs font-semibold text-slate-400">
              — School Principal, Western Province
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="relative px-10 pb-8">
          <p className="text-xs font-medium text-slate-500">
            University of Bedfordshire · Y3 Dissertation · Phase 4
          </p>
        </div>
      </div>

      {/* Right panel – form */}
      <div className="relative flex w-full flex-col lg:w-1/2">
        {/* Mobile logo */}
        <div className="flex items-center px-6 py-5 sm:px-10 lg:hidden">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-blue-500/30 transition-transform group-hover:scale-110">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-white">
              Easy<span className="text-cyan-300">Circular</span>
            </span>
          </Link>
        </div>

        {/* Form area */}
        <div className="flex flex-1 items-center justify-center px-6 pb-10 sm:px-10">
          <div className="w-full max-w-md animate-fade-up">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-2xl">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
