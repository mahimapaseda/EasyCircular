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

  useEffect(() => {
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, []);

  if (!user) return null;

  const initial = user.name.charAt(0).toUpperCase();
  const firstName = user.name.split(" ")[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white py-1 pl-1 pr-2.5 transition hover:border-brand-300 hover:bg-brand-50/50 dark:border-ink-700 dark:bg-ink-900 dark:hover:border-ink-600 dark:hover:bg-ink-800"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-600 text-[11px] font-bold text-white">
          {initial}
        </span>
        <span className="hidden max-w-[88px] truncate text-sm font-semibold text-ink-800 dark:text-ink-200 sm:block">
          {firstName}
        </span>
        <svg
          className={`h-3.5 w-3.5 shrink-0 text-ink-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-64 animate-fade-up overflow-hidden rounded-xl border border-ink-200 bg-white shadow-lg dark:border-ink-700 dark:bg-ink-900 dark:shadow-black/40"
        >
          <div className="border-b border-ink-100 px-4 py-3 dark:border-ink-800">
            <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">{user.name}</p>
            <p className="mt-0.5 truncate text-xs text-ink-500 dark:text-ink-400">{user.email}</p>
          </div>

          <div className="p-1.5">
            <Link
              href="/circulars"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </span>
              Library
            </Link>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
              </span>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showAuthControls = mounted && !loading;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-ink-200 bg-white/85 backdrop-blur-lg dark:border-ink-800 dark:bg-ink-950/85"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Left: Logo & Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 transition-colors duration-200 group-hover:bg-brand-700">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-base font-bold tracking-tight text-ink-900 dark:text-white">
              Easy<span className="text-brand-600 dark:text-brand-400">Circular</span>
            </p>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative rounded-md px-3 py-2 text-sm font-semibold transition-colors duration-200 ${
                    active
                      ? "text-brand-700 dark:text-brand-300"
                      : "text-ink-600 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-200"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-600 dark:bg-brand-400" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right controls */}
        <div className="flex shrink-0 items-center gap-3">
          {showAuthControls && !user && pathname !== "/" && (
            <AuthButtonGroup className="hidden sm:inline-flex" />
          )}
          {showAuthControls && user && <UserMenu />}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle menu"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-ink-200 bg-white transition hover:bg-ink-50 sm:hidden dark:border-ink-800 dark:bg-ink-900 dark:hover:bg-ink-800"
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
        <div className="absolute inset-x-3 top-[calc(100%+0.5rem)] animate-fade-up overflow-hidden rounded-xl border border-ink-200 bg-white p-3 shadow-card sm:hidden dark:border-ink-800 dark:bg-ink-900">
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-brand-50 hover:text-brand-700 dark:text-ink-300 dark:hover:bg-ink-800"
              >
                {item.label}
              </Link>
            ))}
            {showAuthControls && !user && pathname !== "/" && (
              <div className="mt-2 border-t border-ink-200 pt-2 dark:border-ink-800">
                <AuthButtonGroup className="w-full" />
              </div>
            )}
            <div className="mt-2 flex justify-end border-t border-ink-200 pt-2 dark:border-ink-800">
              <ThemeToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
