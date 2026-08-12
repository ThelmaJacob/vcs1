import type { Metadata, Viewport } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";

// Same typeface as the original canvas app (Power Apps ships Open Sans by default).
// Self-hosted at build time: no request leaves the browser for the font.
const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-open-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Public Affairs — Value Capture System",
  description: "Issue tracking and value capture for Public Affairs.",
};

export const viewport: Viewport = {
  width: 1280,
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={openSans.variable}>
      <body>{children}</body>
    </html>
  );
}
