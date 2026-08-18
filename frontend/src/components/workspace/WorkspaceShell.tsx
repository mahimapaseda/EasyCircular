"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const LiquidChrome = dynamic(() => import("@/components/LiquidChrome"), {
  ssr: false,
});

const BROWSE = [
  {
    href: "/circulars",
    label: "Library",
    hint: "Your uploads",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    ),
  },
  {
    href: "/circulars?tab=official",
    label: "Official catalog",
    hint: "moe.gov.lk",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
      />
    ),
  },
] as const;

function SidebarContent({
  pathname,
  tab,
  user,
  onNavigate,
  onSignOut,
}: {
  pathname: string;
  tab: string | null;
  user: { name: string } | null;
  onNavigate?: () => void;
  onSignOut?: () => void;
}) {
  const onCircularDetail = pathname.startsWith("/circular/");
  const onLibrary = pathname === "/circulars" && tab !== "official";
  const onOfficial = pathname === "/circulars" && tab === "official";
  const sliderIndex = onOfficial ? 1 : onLibrary || onCircularDetail ? 0 : -1;

  return (
    <div className="flex h-full flex-col" suppressHydrationWarning>
      <div className="px-4 py-5">
        <Link href="/" onClick={onNavigate} className="group flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 shadow-lg shadow-cyan-500/20 transition-transform group-hover:scale-105">
            <div className="absolute inset-px rounded-[10px] bg-gradient-to-br from-white/25 to-transparent" />
            <svg className="relative h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-tight text-white">
              Easy<span className="text-cyan-300">Circular</span>
            </span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              AI Workspace
            </span>
          </div>
        </Link>
      </div>

      <div className="px-4 pb-4">
        <Link
          href="/#upload"
          onClick={onNavigate}
          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-lg shadow-black/20 transition hover:scale-[1.02]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Analysis
        </Link>
      </div>

      <div className="px-4">
        <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          Browse
        </p>
        <nav className="relative">
          {sliderIndex >= 0 && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 h-[58px] rounded-xl border border-white/10 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-transform duration-300 ease-out"
              style={{ transform: `translateY(${sliderIndex * 62}px)` }}
            />
          )}
          <div className="relative z-10 flex flex-col gap-1">
            {BROWSE.map((item) => {
              const active =
                item.href.includes("tab=official") ? onOfficial : onLibrary || onCircularDetail;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex h-[58px] items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
                    active ? "text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      active ? "bg-cyan-400/15 text-cyan-300" : "bg-white/5 text-slate-500"
                    }`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      {item.icon}
                    </svg>
                  </span>
                  <span className="min-w-0">
                    <span className="block leading-tight">{item.label}</span>
                    <span className="block text-[11px] font-normal text-slate-500">{item.hint}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {user && (
        <div className="mt-auto p-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-bold text-white shadow-md shadow-cyan-500/20">
              {user.name.charAt(0).toUpperCase()}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-black/60 bg-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{user.name.split(" ")[0]}</p>
              <p className="truncate text-[11px] text-slate-400">Signed in</p>
            </div>
            <button
              type="button"
              onClick={() => {
                onSignOut?.();
                onNavigate?.();
              }}
              aria-label="Sign out"
              className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const tab = searchParams.get("tab");

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, tab]);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(
      "a[href], button:not([disabled])",
    );
    firstFocusable?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  function closeDrawer() {
    setMobileOpen(false);
    queueMicrotask(() => menuButtonRef.current?.focus());
  }

  const sidebarProps = {
    pathname,
    tab,
    user,
    onSignOut: signOut,
  };

  return (
    <div className="relative flex min-h-screen" suppressHydrationWarning>
      <div className="fixed inset-0 -z-10" suppressHydrationWarning>
        <LiquidChrome
          baseColor={[0.04, 0.12, 0.35]}
          speed={0.12}
          amplitude={0.28}
          frequencyX={2.5}
          frequencyY={1.8}
          interactive={false}
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/80 to-black/85"
          suppressHydrationWarning
        />
      </div>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] flex-col border-r border-white/10 bg-slate-950/80 backdrop-blur-2xl lg:w-[260px] md:flex">
        <SidebarContent {...sidebarProps} />
      </aside>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={closeDrawer}
        />
      )}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal={mobileOpen}
        aria-label="Workspace menu"
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(85vw,300px)] flex-col border-r border-white/10 bg-slate-950/95 backdrop-blur-2xl transition-transform duration-300 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent {...sidebarProps} onNavigate={closeDrawer} />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col md:pl-[240px] lg:pl-[260px]" suppressHydrationWarning>
        <div className="flex h-12 shrink-0 items-center gap-3 border-b border-white/10 bg-slate-950/90 px-4 backdrop-blur-xl md:hidden" suppressHydrationWarning>
          <button
            ref={menuButtonRef}
            type="button"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-bold text-white">
            Easy<span className="text-cyan-300">Circular</span>
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
