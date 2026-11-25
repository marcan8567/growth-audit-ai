"use client";

import { SITE } from "@/lib/site";
import { trackClick } from "@/lib/track-client";

/** The homepage's "get in touch" band: the logo's yellow, one large LinkedIn button (clicks are counted on /stats). */
export function ContactCta() {
  if (!SITE.linkedinUrl) return null;
  return (
    <section className="bg-marker text-ink">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 py-16 md:flex-row md:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Want help growing your company?</h2>
          <p className="mt-3 max-w-[52ch] text-lg leading-relaxed text-ink/80">
            I can turn your audit into a plan: the full list of fixes, a content plan for LinkedIn and X, and the
            automations set up.
          </p>
        </div>
        <a
          href={SITE.linkedinUrl}
          target="_blank"
          rel="noreferrer"
          onClick={() => trackClick("cta_contact")}
          className="flex shrink-0 items-center gap-3 rounded-xl bg-ink px-7 py-4 text-lg font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-ink/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white motion-reduce:transition-none"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
            <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11H3zM9.5 9.75h3.8v1.5h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1v5.45h-4v-4.83c0-1.15-.02-2.63-1.6-2.63-1.6 0-1.85 1.25-1.85 2.55v4.91h-4z" />
          </svg>
          Get in touch on LinkedIn
        </a>
      </div>
    </section>
  );
}
