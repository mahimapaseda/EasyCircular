"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import UploadDropzone, { UPLOAD_RETURN_TO } from "@/components/UploadDropzone";
import HealthStatus from "@/components/HealthStatus";
import { useAuth } from "@/context/AuthContext";
import { MAX_UPLOAD_MB } from "@/lib/contracts";

const FEATURES = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
    gradient: "from-cyan-400 to-blue-500",
    title: "Smart PDF Extraction",
    desc: "Dual-engine parsing with OCR fallback for Sinhala, Tamil & English scanned documents.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    gradient: "from-purple-400 to-fuchsia-500",
    title: "AI-Powered Summaries",
    desc: "Local LLM or extractive summaries with date and topic guardrails. Not official MOE text. Always check the original circular.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
    gradient: "from-amber-400 to-orange-500",
    title: "Entity Recognition",
    desc: "Automatically highlights dates, legal references, organizations and persons in context.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    gradient: "from-emerald-400 to-teal-500",
    title: "Human-in-the-Loop",
    desc: "Review and correct extracted text before AI runs. Treat summaries as helpers, never as the legal source.",
  },
];

function Sparkle({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
    </svg>
  );
}

function SparkleSmall({ className }: { className?: string }) {
  return (
    <svg className={className} width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
    </svg>
  );
}

export default function HomePage() {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showUserState = mounted && !loading;
  const uploadHref =
    showUserState && user
      ? "#upload"
      : `/sign-in?returnTo=${encodeURIComponent(UPLOAD_RETURN_TO)}`;

  return (
    <div className="min-h-screen">
      {/* ─── Hero ────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] overflow-hidden">
        {/* Sparkle decorations */}
        <Sparkle className="absolute left-[15%] top-[18%] text-white/80 animate-pulse" />
        <SparkleSmall className="absolute left-[25%] top-[12%] text-white/40" />
        <Sparkle className="absolute left-[35%] top-[30%] text-white/50 animate-pulse" />
        <SparkleSmall className="absolute right-[45%] top-[15%] text-white/30" />
        <Sparkle className="absolute right-[15%] top-[10%] text-white/60 animate-pulse" />
        <SparkleSmall className="absolute left-[10%] bottom-[35%] text-white/30" />
        <Sparkle className="absolute left-[30%] bottom-[20%] text-white/40 animate-pulse" />
        <SparkleSmall className="absolute right-[30%] bottom-[25%] text-white/50" />

        <div className="relative mx-auto grid max-w-7xl gap-8 px-5 pt-24 sm:px-8 lg:grid-cols-2 lg:items-center lg:gap-12 lg:pt-32">
          {/* Left: Text content */}
          <div className="animate-fade-up">
            {/* Top badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-300 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              AI-powered, fast & easy.
            </div>

            {/* Main heading */}
            <h1 className="mt-8 text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-[4.2rem]">
              Summarize.
              <br />
              Extract, Analyze, &amp;
              <br />
              <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                Understand.
              </span>
            </h1>

            {/* Description */}
            <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-slate-300">
              Welcome to EasyCircular. Import circulars from the official Ministry of Education
              site, extract key information, and review AI-powered summaries. The original PDF
              remains the legal source.
            </p>

            {/* Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href={uploadHref}
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-bold text-slate-900 shadow-xl shadow-white/10 transition-all hover:scale-[1.03] hover:shadow-2xl hover:shadow-white/15"
              >
                Start Processing
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </Link>
              <Link
                href="/circulars?tab=official"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3 text-sm font-bold text-white transition-all hover:bg-white/10"
              >
                Official circulars
              </Link>
            </div>
          </div>

          {/* Right: Floating badges / visual area */}
          <div className="relative hidden lg:block">
            {/* Decorative glow */}
            <div className="absolute -right-20 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-purple-600/20 blur-[100px]" />
            <div className="absolute -right-10 top-1/4 h-60 w-60 rounded-full bg-cyan-500/15 blur-[80px]" />

            {/* Floating info badges */}
            <div className="relative flex h-[500px] items-center justify-center">
              {/* Center visual element */}
              <div className="relative h-72 w-72 rounded-full border border-white/10 bg-gradient-to-br from-white/5 to-white/0">
                <div className="absolute inset-4 rounded-full border border-white/10 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 backdrop-blur-sm" />
                <div className="absolute inset-12 flex items-center justify-center rounded-full border border-cyan-400/20 bg-black/40 backdrop-blur-xl">
                  <svg className="h-16 w-16 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                </div>
              </div>

              {/* Floating badge: Top right */}
              <div className="absolute right-4 top-16 rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 backdrop-blur-xl shadow-xl animate-float">
                <p className="text-xs font-bold text-white">Multi-language OCR</p>
              </div>


              {/* Floating badge: Bottom */}
              <div className="absolute bottom-16 right-12 rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 backdrop-blur-xl shadow-xl animate-float">
                <p className="text-xs font-bold text-white">Process in &lt;60 seconds</p>
              </div>

              {/* Floating badge: Left */}
              <div className="absolute left-0 top-1/3 rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 backdrop-blur-xl shadow-xl animate-float-delayed">
                <p className="text-xs font-bold text-white">NER Highlights</p>
              </div>

              {/* Sparkles around the circle */}
              <Sparkle className="absolute left-12 top-10 text-white/70 animate-pulse" />
              <SparkleSmall className="absolute right-20 top-8 text-white/40" />
              <Sparkle className="absolute bottom-24 left-8 text-white/50 animate-pulse" />
              <SparkleSmall className="absolute bottom-12 right-24 text-white/60" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────── */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 sm:px-8">
        <div className="mb-14 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Features</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Powerful AI tools for education
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">
            Built specifically for Sri Lankan Ministry of Education circulars with multi-language support.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className="group flex gap-5 rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-black/40 animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg`}
              >
                {feature.icon}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────────────── */}
      <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 sm:px-8">
        <div className="mb-14 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">How it works</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Four simple steps
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { num: "01", title: "Upload", desc: "Drop your PDF circular", icon: "M3 16.5v2.25A3.375 3.375 0 006.75 21h10.5a3.375 3.375 0 003.375-3.375V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" },
            { num: "02", title: "Extract", desc: "AI reads the document", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
            { num: "03", title: "Review", desc: "Verify extracted text", icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" },
            { num: "04", title: "Summarize", desc: "Get actionable insights", icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" },
          ].map((step, i) => (
            <div
              key={step.num}
              className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center backdrop-blur-md transition-all hover:border-white/20 hover:bg-black/40 animate-fade-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-blue-600/20 border border-cyan-400/20">
                <svg className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={step.icon} />
                </svg>
              </div>
              <p className="text-[11px] font-bold text-cyan-400/80">STEP {step.num}</p>
              <h3 className="mt-1 text-lg font-bold text-white">{step.title}</h3>
              <p className="mt-1 text-sm text-slate-300">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── System status ───────────────────────────────────────── */}
      <section id="system-status" className="mx-auto max-w-2xl scroll-mt-20 px-5 py-10 sm:px-8">
        <div className="mb-5 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">System Status</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
            Service health
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Backend, MongoDB, AI pipeline, and local LLM should all show as healthy before you upload.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur-md">
          <HealthStatus />
        </div>
      </section>

      {/* ─── Upload zone ──────────────────────────────────────────── */}
      <section id="upload" className="relative scroll-mt-20">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
        <div className="mx-auto max-w-2xl px-5 py-20 sm:px-8">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-xl shadow-blue-500/20">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A3.375 3.375 0 006.75 21h10.5a3.375 3.375 0 003.375-3.375V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Upload a circular
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              PDF only · up to {MAX_UPLOAD_MB} MB · sign in to get started
            </p>
          </div>
          <UploadDropzone />
        </div>
      </section>
    </div>
  );
}
