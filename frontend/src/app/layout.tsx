import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  applicationName: "EasyCircular",
  title: "EasyCircular — MOE Circular Summaries",
  description:
    "Upload Ministry of Education circulars, review extracted text, and get structured summaries.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EasyCircular",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4f46e5" },
    { media: "(prefers-color-scheme: dark)", color: "#09071a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plusJakartaSans.variable} font-sans`}>
        <Script src="/theme-init.js" strategy="beforeInteractive" />
        <AuthProvider>
          <ToastProvider>
            {children}
            <ServiceWorkerRegister />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
