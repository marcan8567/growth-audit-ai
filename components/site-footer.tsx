import Link from "next/link";
import { LEGAL_READY } from "@/lib/site";

/** The footer on every page: what the tool reads, and the legal links once the details are filled in. */
export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-8 text-sm text-ink-soft">
        <p>Reads public website content only. No cookies. Shared reports are kept for six months.</p>
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
    </footer>
  );
}
