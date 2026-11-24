import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { LEGAL_READY, SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Impressum · Growth Audit AI", robots: { index: false } };

/** Legal notice under § 5 DDG (Digitale-Dienste-Gesetz). Hidden until the details in lib/site.ts are complete. */
export default function ImpressumPage() {
  if (!LEGAL_READY) notFound();
  const { name, street, city, email } = SITE.legal;

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-20 pt-6">
        <Link href="/" aria-label="Growth Audit AI, home" className="rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-marker">
          <Logo />
        </Link>
        <h1 className="mt-10 text-4xl font-bold tracking-tight">Impressum</h1>
        <p className="mt-2 text-ink-soft">Legal notice</p>

        <section className="mt-10 flex flex-col gap-8 leading-relaxed">
          <div>
            <h2 className="text-lg font-semibold">Angaben gemäß § 5 DDG</h2>
            <p className="mt-2">
              {name}
              <br />
              {street}
              <br />
              {city}
              <br />
              Deutschland
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Kontakt</h2>
            <p className="mt-2">
              E-Mail: <a href={`mailto:${email}`} className="underline underline-offset-4">{email}</a>
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">About this website</h2>
            <p className="mt-2 text-ink-soft">
              Growth Audit AI is a private portfolio project. Reports are generated automatically with AI from public website
              content; they can contain errors and are not professional advice. Links to external websites are the
              responsibility of their operators.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
