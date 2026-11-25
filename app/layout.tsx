import type { Metadata } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import "./globals.css";

// One type family for the whole product: a sturdy grotesk with some character, made for reading reports.
const schibsted = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-schibsted", display: "swap" });

// The site's own address, so link previews get absolute image URLs. Vercel sets VERCEL_PROJECT_PRODUCTION_URL.
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  twitter: { card: "summary_large_image" },
  title: "Growth Audit AI: a growth audit from any company website",
  description:
    // Under 155 characters, so search results show it in full.
    "Paste a company website and get a scored growth audit in about a minute: Google speed data, brand voice, LinkedIn and X posts and an automation plan.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={schibsted.variable}>
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">{children}</body>
    </html>
  );
}
