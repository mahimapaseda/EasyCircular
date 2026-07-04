"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative mt-auto border-t border-white/10">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
          {/* Brand */}
          <div className="flex-1">
            <div className="flex items-center justify-center gap-2.5 sm:justify-start">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 shadow-md shadow-blue-500/20">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-white">
                Easy<span className="text-cyan-300">Circular</span>
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
              AI-powered document intelligence for Sri Lankan Ministry of Education circulars.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-6">
            <Link href="/" className="text-sm font-medium text-slate-400 transition hover:text-white">
              Home
            </Link>
            <Link href="/circulars" className="text-sm font-medium text-slate-400 transition hover:text-white">
              Library
            </Link>
            <Link href="/sign-in" className="text-sm font-medium text-slate-400 transition hover:text-white">
              Sign in
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center gap-3 border-t border-white/5 pt-6 sm:flex-row sm:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {["Next.js", "FastAPI", "MongoDB", "LangChain"].map((tech) => (
              <span
                key={tech}
                className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-500"
              >
                {tech}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-slate-600">
            University of Bedfordshire · Y3 Dissertation · Phase 4
          </p>
        </div>
      </div>
    </footer>
  );
}
