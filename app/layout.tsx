import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Growth Audit AI",
  description:
    "Turn any company URL into a brand voice profile, growth audit, content pack and automation plan.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">{children}</body>
    </html>
  );
}
