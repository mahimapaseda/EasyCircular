"use client";

import dynamic from "next/dynamic";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

const LiquidChrome = dynamic(() => import("@/components/LiquidChrome"), {
  ssr: false,
});

export default function MainShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col" suppressHydrationWarning>
      <div className="fixed inset-0 -z-10" suppressHydrationWarning>
        <LiquidChrome
          baseColor={[0.04, 0.12, 0.35]}
          speed={0.25}
          amplitude={0.5}
          frequencyX={2.5}
          frequencyY={1.8}
          interactive={true}
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>
      <Header />
      <main className="flex-1 pt-20">{children}</main>
      <Footer />
    </div>
  );
}
