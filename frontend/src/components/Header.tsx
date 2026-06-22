"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AuthButtonGroup from "@/components/AuthButtonGroup";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/circulars", label: "Library" },
];

function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!user) return null;

  const initial = user.name.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-full border border-brand-100/50 bg-white/50 py-1.5 pl-1.5 pr-4 transition-all duration-300 hover:border-brand-200 hover:bg-white/80 hover:shadow-sm dark:border-ink-800/50 dark:bg-ink-900/50 dark:hover:border-ink-700 dark:hover:bg-ink-800"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-600 text-xs font-black text-white shadow-sm ring-2 ring-white dark:ring-ink-950">
          {initial}
        </span>
        <span className="hidden max-w-[100px] truncate text-sm font-bold text-ink-800 dark:text-ink-200 sm:block">
          {user.name.split(" ")[0]}
        </span>
        <svg
          className={`h-3.5 w-3.5 text-ink-500 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-3 w-56 animate-fade-up overflow-hidden rounded-3xl border border-brand-100/60 bg-white/95 p-1.5 shadow-xl shadow-brand-900/5 backdrop-blur-xl dark:border-ink-800/80 dark:bg-ink-900/95 dark:shadow-black/50">
          <div className="mb-1 rounded-2xl bg-gradient-to-br from-brand-50/50 to-fuchsia-50/50 px-4 py-4 dark:from-brand-950/20 dark:to-fuchsia-950/10">
            <p className="truncate text-sm font-black text-ink-900 dark:text-white">
              {user.name}
            </p>
            <p className="truncate text-xs font-medium text-ink-500 dark:text-ink-400">
              {user.email}
            </p>
          </div>
          <Link
            href="/circulars"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-ink-700 transition hover:bg-brand-50 hover:text-brand-700 dark:text-ink-300 dark:hover:bg-brand-900/30 dark:hover:text-brand-300"
          >
            <svg className="h-4.5 w-4.5 text-brand-500 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Your library
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              signOut();
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
          >
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 sm:px-6 sm:pt-6 transition-all duration-300">
      <div
        className={`mx-auto flex w-full max-w-7xl items-center justify-between gap-4 rounded-full transition-all duration-500 ${
          scrolled
            ? "border border-brand-200/50 bg-white/70 px-4 py-2.5 shadow-lg shadow-brand-900/5 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-950/70 sm:px-6"
            : "border border-transparent bg-transparent px-2 py-2 sm:px-4"
        }`}
      >
        {/* Left: Logo & Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-600 shadow-md shadow-brand-500/20 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-brand-500/30">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <p className="text-base font-black tracking-tight text-ink-900 dark:text-white">
                EasyCircular
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-2 md:flex">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative rounded-full px-4 py-2 text-sm font-bold transition-all duration-300 ${
                    active
                      ? "bg-brand-50 text-brand-700 shadow-sm dark:bg-brand-900/30 dark:text-brand-300"
                      : "text-ink-600 hover:bg-ink-50 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-900/50 dark:hover:text-ink-200"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right controls */}
        <div className="flex shrink-0 items-center gap-3">
          {!loading && !user && pathname !== "/" && (
            <AuthButtonGroup className="hidden sm:inline-flex" />
          )}
          {!loading && user && <UserMenu />}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          
          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle menu"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-100/50 bg-white/50 transition hover:bg-white/80 sm:hidden dark:border-ink-800/50 dark:bg-ink-900/50 dark:hover:bg-ink-800"
          >
            <svg className="h-5 w-5 text-ink-800 dark:text-ink-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="absolute inset-x-4 top-[calc(100%+0.5rem)] animate-fade-up overflow-hidden rounded-3xl border border-brand-200/50 bg-white/95 p-4 shadow-xl shadow-brand-900/10 backdrop-blur-xl sm:hidden dark:border-ink-800/60 dark:bg-ink-950/95">
          <nav className="flex flex-col gap-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl px-4 py-3 text-sm font-bold text-ink-700 hover:bg-brand-50 hover:text-brand-700 dark:text-ink-300 dark:hover:bg-ink-900"
              >
                {item.label}
              </Link>
            ))}
            {!loading && !user && pathname !== "/" && (
              <div className="mt-2 border-t border-brand-100 pt-2 dark:border-ink-800">
                <AuthButtonGroup className="w-full" />
              </div>
            )}
            <div className="mt-2 pt-2 border-t border-brand-100 dark:border-ink-800 flex justify-end">
               <ThemeToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
