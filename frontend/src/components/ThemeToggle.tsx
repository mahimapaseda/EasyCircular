"use client";

import { useTheme } from "@/context/ThemeContext";

type ThemeToggleProps = {
  className?: string;
  compact?: boolean;
};

export default function ThemeToggle({ className = "", compact = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-full border transition ${
        compact ? "h-8 w-8" : "h-9 w-9"
      } border-slate-200 bg-white/80 text-ink-700 hover:bg-white hover:text-ink-900 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white ${className}`}
    >
      <svg
        className="h-4 w-4 dark:hidden"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21.752 15.002A9.718 9.718 0 0112 21.75 9.75 9.75 0 1112.003 2.25a.75.75 0 01.09 1.495 7.5 7.5 0 009.164 9.164.75.75 0 011.495.093z"
        />
      </svg>
      <svg
        className="hidden h-4 w-4 dark:block"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v1.5M12 19.5V21M4.5 12H3m18 0h-1.5M6.34 6.34l-1.06-1.06M18.72 18.72l-1.06-1.06M6.34 17.66l-1.06 1.06M18.72 5.28l-1.06 1.06M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
        />
      </svg>
    </button>
  );
}
