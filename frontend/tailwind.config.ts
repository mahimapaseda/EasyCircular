import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand: Vibrant indigo-violet
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        // Secondary accent: Vivid fuchsia/pink
        fuchsia: {
          50: "#fdf4ff",
          100: "#fae8ff",
          200: "#f5d0fe",
          300: "#f0abfc",
          400: "#e879f9",
          500: "#d946ef",
          600: "#c026d3",
          700: "#a21caf",
          800: "#86198f",
          900: "#701a75",
          950: "#4a044e",
        },
        // Warm amber accent
        amber: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
        },
        // Vibrant emerald for success
        emerald: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        // Neutral ink
        ink: {
          50: "#f8fafc",
          100: "#f1f5f9",
          150: "#eaf0f7",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        // Light mode surface warm white
        surface: {
          DEFAULT: "#ffffff",
          warm: "#fdfcfb",
          muted: "#f5f3ff",
        },
        // Vivid rose/red for errors
        rose: {
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
          700: "#be123c",
          800: "#9f1239",
          900: "#881337",
          950: "#4c0519",
        },
        // Violet for entities
        violet: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",
        },
        // Cyan for LAW entities
        cyan: {
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
          950: "#083344",
        },
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
        display: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #6366f1 0%, #c026d3 100%)",
        "gradient-warm": "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
        "gradient-hero": "linear-gradient(135deg, #eef2ff 0%, #fdf4ff 50%, #fff1f2 100%)",
        "gradient-hero-dark": "linear-gradient(135deg, #1e1b4b 0%, #4a044e 50%, #1e1b4b 100%)",
        "gradient-card": "linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(238,242,255,0.6) 100%)",
        "gradient-mesh": "radial-gradient(at 20% 30%, rgba(99,102,241,0.15) 0px, transparent 50%), radial-gradient(at 80% 70%, rgba(192,38,211,0.12) 0px, transparent 50%), radial-gradient(at 50% 50%, rgba(251,191,36,0.08) 0px, transparent 50%)",
      },
      boxShadow: {
        panel: "0 1px 3px rgba(99,102,241,0.08), 0 4px 16px rgba(99,102,241,0.06)",
        "panel-hover": "0 4px 24px rgba(99,102,241,0.15), 0 8px 40px rgba(192,38,211,0.08)",
        card: "0 2px 8px rgba(15,23,42,0.06), 0 12px 32px rgba(15,23,42,0.04)",
        lift: "0 16px 48px -8px rgba(99,102,241,0.4)",
        "lift-fuchsia": "0 16px 48px -8px rgba(192,38,211,0.3)",
        glow: "0 0 0 3px rgba(99,102,241,0.25)",
        "glow-fuchsia": "0 0 0 3px rgba(192,38,211,0.25)",
        "inner-brand": "inset 0 2px 8px rgba(99,102,241,0.12)",
        toast: "0 8px 32px rgba(15,23,42,0.16), 0 2px 8px rgba(15,23,42,0.08)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulsebar: {
          "0%, 100%": { transform: "translateX(-100%)" },
          "50%": { transform: "translateX(200%)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(99,102,241,0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(99,102,241,0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "bounce-in": {
          "0%": { opacity: "0", transform: "scale(0.8)" },
          "60%": { transform: "scale(1.05)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fade-in 0.3s ease-out forwards",
        "slide-in-right": "slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        pulsebar: "pulsebar 1.8s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        float: "float 3s ease-in-out infinite",
        "spin-slow": "spin-slow 8s linear infinite",
        "bounce-in": "bounce-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
