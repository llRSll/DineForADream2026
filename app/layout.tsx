import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import { branding } from "@/lib/branding";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: `${branding.name} — ${branding.eventTitle}`,
  description: branding.description,
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
};

export default RootLayout;
