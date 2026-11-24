import type { Metadata } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import "./globals.css";

// One type family for the whole product: a sturdy grotesk with some character, made for reading reports.
const schibsted = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-schibsted", display: "swap" });

export const metadata: Metadata = {
  title: "Growth Audit AI: a growth audit from any company website",
  description:
    "Paste a company website and get a scored growth audit, Google speed data, the brand voice, ready-to-post LinkedIn and X posts and an automation plan in about a minute.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={schibsted.variable}>
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">{children}</body>
    </html>
  );
}
