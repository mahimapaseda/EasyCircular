"use client";

import { useEffect, useState } from "react";

function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  localStorage.setItem("theme", theme);
}

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    applyTheme(next ? "dark" : "light");
  }

  const ariaLabel = mounted
    ? isDark
      ? "Switch to light mode"
      : "Switch to dark mode"
    : "Toggle color theme";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={ariaLabel}
      suppressHydrationWarning
      className="relative flex h-9 w-9 items-center justify-center rounded-xl border-2 border-brand-100 bg-white text-ink-600 transition-all duration-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 dark:hover:border-brand-600 dark:hover:text-brand-400"
    >
      {mounted && isDark ? (
        /* Sun icon for dark mode */
        <svg className="h-4.5 w-4.5 animate-bounce-in" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      ) : (
        /* Moon icon for light mode */
        <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      )}
    </button>
  );
}
