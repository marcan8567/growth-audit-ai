import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { LEGAL_READY, SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Legal notice (Aviso legal) · Growth Audit AI", robots: { index: false } };

/**
 * Legal notice under Spanish law: Art. 10 of Ley 34/2002 (LSSI-CE).
 * Hidden until the details in lib/site.ts are complete.
 */
export default function LegalNoticePage() {
  if (!LEGAL_READY) notFound();
  const { name, street, city, country, email, taxId } = SITE.legal;

  return (
    <>
      <main className="mx-auto w-full max-w-3xl px-6 pb-20 pt-6 text-ink">
        <Link href="/" aria-label="Growth Audit AI, home" className="rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-marker">
          <Logo />
        </Link>
        <h1 className="mt-10 text-4xl font-bold tracking-tight">Legal notice</h1>
        <p className="mt-2 text-ink-soft">Aviso legal, under Art. 10 of Ley 34/2002 (LSSI-CE)</p>

        <div className="mt-10 flex flex-col gap-8 leading-relaxed [&_h2]:text-lg [&_h2]:font-semibold [&_p]:mt-2">
          <section>
            <h2>Website owner (Titular)</h2>
            <p>
              {name}
              <br />
              {street}
              <br />
              {city}
              <br />
              {country.local}
              {taxId && (
                <>
                  <br />
                  NIF/NIE: {taxId}
                </>
              )}
            </p>
          </section>

          <section>
            <h2>Contact</h2>
            <p>
              Email: <a href={`mailto:${email}`} className="underline underline-offset-4">{email}</a>
            </p>
          </section>

          <section>
            <h2>About this website</h2>
            <p className="text-ink-soft">
              Growth Audit AI is a portfolio project. It produces automated growth audits of public websites using AI. Reports
              can contain errors and are not professional advice. The project is not affiliated with the companies whose
              websites are analysed; their names and logos belong to their owners.
            </p>
          </section>

          <section>
            <h2>Links to other websites</h2>
            <p className="text-ink-soft">
              This website links to external sites, such as LinkedIn and GitHub. Their operators are responsible for their
              content.
            </p>
          </section>

          <section>
            <h2>Applicable law</h2>
            <p className="text-ink-soft">
              This website and its use are governed by Spanish law. This does not affect any mandatory consumer protection
              rights you have under the law of the country where you live.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
