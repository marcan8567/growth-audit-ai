import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Report } from "@/components/report";
import { loadReport } from "@/lib/store/reports";

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
  };
}

export default async function SavedReportPage({ params }: Props) {
  const report = await loadReport((await params).id);
  if (!report) notFound();

  const created = new Date(report.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/" className="text-lg font-bold tracking-tight text-ink hover:underline">
            Growth Audit AI
          </Link>
          <h1 className="mt-1 text-3xl font-semibold">Growth audit: {report.site?.domain ?? "website"}</h1>
          <p className="mt-1 text-sm text-stone-500">
            Created {created} from the public website{report.site ? ` (${report.site.finalUrl})` : ""}.
          </p>
        </div>
        <Link
          href="/audit"
          className="w-fit shrink-0 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
        >
          Audit another website
        </Link>
      </header>

      <Report data={report} />
    </main>
  );
}
