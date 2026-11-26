import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Report } from "@/components/report";
import { redactReportForVisitor } from "@/lib/report-access";
import { loadReport } from "@/lib/store/reports";
import { track } from "@/lib/store/stats";
import { Logo } from "@/components/logo";
import { SITE } from "@/lib/site";
import { SiteFooter } from "@/components/site-footer";

// A saved report, read from Redis on every visit. Links look like /r/AbC123xYz_.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const report = await loadReport((await params).id);
  if (!report) return { title: "Report not found · Growth Audit AI" };
  const domain = report.site?.domain ?? "Website";
  const score = report.audit ? ` (${report.audit.overallScore}/100)` : "";
  return {
    title: `${domain} growth audit${score} · Growth Audit AI`,
    description: report.audit?.summary ?? "A growth audit built from the company's own public website.",
    robots: { index: false }, // reports are private-by-link, so keep them out of search engines
    twitter: { card: "summary_large_image" },
  };
}

export default async function SavedReportPage({ params }: Props) {
  const report = await loadReport((await params).id);
  if (!report) notFound();
  await track("report_view");

  return (
    <>
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 pb-20 pt-6">
        <header className="flex items-center justify-between gap-4 print:hidden">
          <Link href="/" aria-label="Growth Audit AI, home" className="rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-marker">
            <Logo />
          </Link>
          <Link
            href="/audit"
            className="shrink-0 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white hover:bg-ink/85 sm:px-4 sm:text-sm"
          >
            Audit another website
          </Link>
        </header>
        {/* The cover inside the report shows the company, score and date; this heading is for screen readers. */}
        <h1 className="sr-only">Growth audit of {report.site?.domain ?? "a website"}</h1>
  
        {report.site?.domain === SITE.demoSiteDomain && (
          <p className="rounded-xl border-l-4 border-marker bg-mist px-5 py-4 text-sm leading-relaxed text-ink">
            <span className="font-semibold">Sample report.</span> Stryon Labs is a fictional AI agency we built as a demo
            website. The audit itself is real: it was run by this tool on{" "}
            <a href={`https://${SITE.demoSiteDomain}`} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              {SITE.demoSiteDomain}
            </a>
            .
          </p>
        )}

        {/* Visitors' reports hide all but the first quick win; the owner's showcase audits are shown in full. */}
        <Report data={report.owner ? report : redactReportForVisitor(report)} createdAt={report.createdAt} shareUrl="current" reportId={report.id} />
      </main>
      <SiteFooter />
    </>
  );
}
