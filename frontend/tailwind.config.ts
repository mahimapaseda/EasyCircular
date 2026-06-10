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
        },
        grape: {
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
        },
        coral: {
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
        },
        sun: {
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        mint: {
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "hero-light":
          "radial-gradient(1200px 600px at 10% -10%, #e0e7ff 0%, transparent 55%), radial-gradient(1000px 500px at 100% 0%, #fae8ff 0%, transparent 50%), linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        "hero-dark":
          "radial-gradient(1200px 600px at 10% -10%, #312e81 0%, transparent 55%), radial-gradient(1000px 500px at 100% 0%, #4a044e 0%, transparent 50%), linear-gradient(180deg, #020617 0%, #0f172a 100%)",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.06)",
        glow: "0 16px 50px -12px rgb(99 102 241 / 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
