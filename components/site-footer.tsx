import Link from "next/link";
import { LEGAL_READY, SITE } from "@/lib/site";

const GITHUB_PROFILE = new URL(SITE.repoUrl).origin + "/" + new URL(SITE.repoUrl).pathname.split("/")[1];

/** The footer on every page: who built it, what the tool reads, and the legal links once the details are filled in. */
export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-4 px-6 py-8 text-sm text-ink-soft">
        <div className="flex flex-col gap-1">
          <p>
            Built by <span className="font-semibold text-ink">{SITE.author}</span>
          </p>
          <p>Reads public website content only. No cookies. Shared reports are kept for six months.</p>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <nav aria-label="Profiles" className="flex gap-2">
            <a
              href={SITE.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${SITE.author} on LinkedIn`}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-white hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-marker"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11H3zM9.5 9.75h3.8v1.5h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1v5.45h-4v-4.83c0-1.15-.02-2.63-1.6-2.63-1.6 0-1.85 1.25-1.85 2.55v4.91h-4z" />
              </svg>
            </a>
            <a
              href={GITHUB_PROFILE}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${SITE.author} on GitHub`}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-white hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-marker"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.56 9.56 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
              </svg>
            </a>
          </nav>
          {LEGAL_READY && (
            <nav aria-label="Legal" className="flex gap-5">
              <Link href="/legal-notice" className="hover:text-ink hover:underline">
                Legal notice
              </Link>
              <Link href="/privacy" className="hover:text-ink hover:underline">
                Privacy policy
              </Link>
            </nav>
          )}
        </div>
      </div>
    </footer>
  );
}
