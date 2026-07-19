import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FinSight",
    template: "%s | FinSight",
  },

  description:
    "A private personal finance dashboard for accounts, expenses, savings projections, and financial intelligence.",

  applicationName: "FinSight",

  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
  themeColor: "#07090e",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-dvh bg-[#07090e] font-sans text-white antialiased">
        {children}

        <Toaster />
      </body>
    </html>
  );
}
