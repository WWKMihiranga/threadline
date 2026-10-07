import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";

// Self-hosted variable fonts: no request to Google at runtime, no layout shift.
const jost = localFont({ src: "../fonts/jost.woff2", variable: "--font-jost", weight: "300 700", display: "swap" });
const inter = localFont({ src: "../fonts/inter.woff2", variable: "--font-inter", weight: "300 700", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Threadline — Modern clothing, made to last", template: "%s · Threadline" },
  description:
    "Threadline is a Sri Lankan fashion store for timeless everyday clothing and accessories. Island-wide delivery, bulk orders welcome.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jost.variable} ${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster position="bottom-center" toastOptions={{ style: { borderRadius: 0 } }} />
      </body>
    </html>
  );
}
