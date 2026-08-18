"use client";

import dynamic from "next/dynamic";
import { useTheme } from "@/context/ThemeContext";

const LiquidChrome = dynamic(() => import("@/components/LiquidChrome"), {
  ssr: false,
});

const DARK_COLOR: [number, number, number] = [0.04, 0.12, 0.35];
const LIGHT_COLOR: [number, number, number] = [0.82, 0.88, 0.98];

type ThemedBackdropProps = {
  speed?: number;
  amplitude?: number;
  frequencyX?: number;
  frequencyY?: number;
  interactive?: boolean;
  overlay?: "main" | "workspace" | "auth";
};

export default function ThemedBackdrop({
  speed = 0.25,
  amplitude = 0.5,
  frequencyX = 2.5,
  frequencyY = 1.8,
  interactive = true,
  overlay = "main",
}: ThemedBackdropProps) {
  const { theme } = useTheme();
  const dark = theme === "dark";

  const overlayClass =
    overlay === "workspace"
      ? dark
        ? "bg-gradient-to-b from-black/85 via-black/80 to-black/85"
        : "bg-gradient-to-b from-slate-100/80 via-white/70 to-slate-100/85"
      : dark
        ? "bg-black/60"
        : "bg-white/55";

  return (
    <div className="fixed inset-0 -z-10" suppressHydrationWarning>
      <LiquidChrome
        baseColor={dark ? DARK_COLOR : LIGHT_COLOR}
        speed={speed}
        amplitude={amplitude}
        frequencyX={frequencyX}
        frequencyY={frequencyY}
        interactive={interactive}
      />
      <div className={`absolute inset-0 ${overlayClass}`} />
    </div>
  );
}
