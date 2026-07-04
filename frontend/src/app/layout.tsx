import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
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
  themeColor: "#0a0f1a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${plusJakartaSans.variable} font-sans`}>
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
