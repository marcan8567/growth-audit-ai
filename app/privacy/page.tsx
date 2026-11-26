import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { LEGAL_READY, SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy policy (Política de privacidad) · Growth Audit AI", robots: { index: false } };

/**
 * Privacy policy under Art. 13 GDPR and Spain's Ley Orgánica 3/2018 (LOPDGDD), describing what the
 * site actually does. Keep it in sync with the code: any new service, cookie or data field needs a section here.
 */
export default function PrivacyPage() {
  if (!LEGAL_READY) notFound();
  const { name, street, city, country, email } = SITE.legal;

  return (
    <>
      <main className="mx-auto w-full max-w-3xl px-6 pb-20 pt-6 text-ink">
        <Link href="/" aria-label="Growth Audit AI, home" className="rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-marker">
          <Logo />
        </Link>
        <h1 className="mt-10 text-4xl font-bold tracking-tight">Privacy policy</h1>
        <p className="mt-2 text-ink-soft">Política de privacidad, as of 26 November 2026</p>

        <div className="mt-10 flex flex-col gap-8 leading-relaxed [&_h2]:text-lg [&_h2]:font-semibold [&_p]:mt-2 [&_p]:text-ink-soft [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-ink-soft">
          <section>
            <h2>1. Who is responsible (Responsable del tratamiento)</h2>
            <p>
              {name}, {street}, {city}, {country.english}. Email:{" "}
              <a href={`mailto:${email}`} className="underline underline-offset-4">{email}</a>
            </p>
          </section>

          <section>
            <h2>2. In short</h2>
            <ul>
              <li>No account, no cookies, no tracking profiles, no advertising.</li>
              <li>An audit reads the public website you enter. You don&apos;t need to give any personal data.</li>
              <li>Leaving your email under a report is optional; it is only used to reply to you and deleted after 12 months.</li>
              <li>Your IP address is processed for hosting and, in pseudonymised form, to enforce the daily limit.</li>
            </ul>
          </section>

          <section>
            <h2>3. Hosting and server logs</h2>
            <p>
              The website is hosted by Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA. When you open a page,
              Vercel processes technical data such as your IP address, the time, the page requested and your browser&apos;s
              user agent, to deliver the page and keep the service secure. Legal basis: Art. 6(1)(f) GDPR (legitimate
              interest in a secure, working website). Data is transferred to the USA on the basis of the EU-US Data Privacy
              Framework and the European Commission&apos;s standard contractual clauses.
            </p>
            <p>
              This policy also covers the demo website{" "}
              <a href={`https://${SITE.demoSiteDomain}`} className="underline underline-offset-4">{SITE.demoSiteDomain}</a> (Stryon Labs, a
              fictional company used to show what this tool does). It is run by the same person, hosted by Vercel in the same way,
              sets no cookies, has no forms and collects no other data.
            </p>
          </section>

          <section>
            <h2>4. Running an audit</h2>
            <p>
              The website address you enter is used to read that website&apos;s public pages. Their content is sent to Google
              (Google LLC / Google Ireland Ltd.) for analysis with the Gemini API, and the address to Google PageSpeed Insights
              for speed measurements. This concerns public company content, not data about you. Legal basis: Art. 6(1)(b) and
              (f) GDPR.
            </p>
          </section>

          <section>
            <h2>5. Saved reports</h2>
            <p>
              Each report is stored with Upstash, Inc. (database in the USA) so it can be opened from its link. Reports contain
              only information from the audited website, not data about the person who ran the audit. Visitors&apos; reports are
              deleted automatically after six months.
            </p>
          </section>

          <section>
            <h2>6. Daily limit</h2>
            <p>
              To limit costs and prevent abuse, each visitor can run three free audits per day. For this, your IP address is
              converted into a one-way hash (pseudonymised) and counted in the database for up to 24 hours; the IP address itself
              is not stored. Legal basis: Art. 6(1)(f) GDPR (legitimate interest in preventing abuse).
            </p>
          </section>

          <section>
            <h2>7. If you leave your email</h2>
            <p>
              Under each report you can choose to leave your email address to receive the full list of fixes. It is stored
              with Upstash, Inc. (database in the USA) together with the audited website and the date, read only by the person
              responsible named above, and used only to reply to your request: no newsletter, no sharing, no advertising.
              It is deleted automatically after 12 months, or earlier if you ask. Legal basis: Art. 6(1)(a) GDPR (your
              consent, given by sending the form), which you can withdraw at any time by email, without affecting replies
              sent before. A notification that an email was left (naming the audited website, not your address) is sent to a
              private Discord channel.
            </p>
          </section>

          <section>
            <h2>8. Usage statistics</h2>
            <p>
              The site counts how often pages are viewed, audits are run and buttons are clicked, as daily totals only. No
              cookies are used, and no data about individual visitors is stored.
            </p>
          </section>

          <section>
            <h2>9. Company logos and fonts</h2>
            <p>
              Company logos are fetched by our server and delivered from our own domain, and the fonts are served from our own
              server too. Your browser does not contact the audited company&apos;s website or Google Fonts.
            </p>
          </section>

          <section>
            <h2>10. Contact via LinkedIn, and sharing</h2>
            <p>
              &quot;Message me on LinkedIn&quot; buttons link to a LinkedIn profile. LinkedIn&apos;s own privacy policy applies once you
              open it. When such a button is clicked, a notification naming the audited website (not you) is sent to a private
              Discord channel (Discord Inc., USA) so the request can be answered.
            </p>
            <p>
              The &quot;Share on LinkedIn&quot; and &quot;Share on X&quot; buttons on reports are plain links: no scripts or cookies from
              LinkedIn or X load on this site, and nothing is sent to them until you click one. After that, their own privacy
              policies apply.
            </p>
          </section>

          <section>
            <h2>11. Storage in your browser</h2>
            <p>
              The site sets no cookies. Only on the private statistics page is the entered access code kept in your
              browser&apos;s session storage until you close the tab; this is strictly necessary for that page to work and
              exempt from consent (Art. 22.2 LSSI-CE).
            </p>
          </section>

          <section>
            <h2>12. Your rights</h2>
            <p>
              Under the GDPR and the LOPDGDD you have the right to access, rectification, erasure, restriction of processing,
              data portability, and to object to processing based on Art. 6(1)(f) GDPR (Art. 15–21 GDPR). To exercise them,
              email the address above. You can also lodge a complaint with the Spanish Data Protection Agency (Agencia Española
              de Protección de Datos, www.aepd.es) or the supervisory authority of the EU country where you live.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
