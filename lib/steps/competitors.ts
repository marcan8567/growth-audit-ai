import "server-only";
import type { Lang } from "@/lib/i18n";
import { runSiteChecks } from "@/lib/reader/checks";
import { readWebsite } from "@/lib/reader/read-website";
import { runGrowthAudit } from "@/lib/steps/growth-audit";

/** One competitor in the comparison: its scores only, or why it couldn't be audited. */
export type CompetitorResult =
  | { domain: string; name: string; overallScore: number; grade: string; categories: { id: string; score: number }[] }
  | { domain: string; error: string };

export const MAX_COMPETITORS = 2;

/**
 * Optional competitor comparison. Each competitor\'s website is read, checked in code and scored by the same
 * growth audit as the main site, so the numbers are comparable. To keep the extra cost and time small,
 * competitors skip Google PageSpeed and the other AI steps, and only their scores are kept in the report.
 * One competitor failing doesn\'t stop the other, or the main audit.
 */
export async function runCompetitors(urls: string[], lang: Lang): Promise<CompetitorResult[]> {
  return Promise.all(
    urls.slice(0, MAX_COMPETITORS).map(async (url): Promise<CompetitorResult> => {
      let domain = url.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
      try {
        const site = await readWebsite(url);
        domain = site.domain;
        const audit = await runGrowthAudit(site, runSiteChecks(site, lang), lang);
        return {
          domain,
          name: site.brand?.name || domain,
          overallScore: audit.overallScore,
          grade: audit.grade,
          categories: audit.categories.map((c) => ({ id: c.id, score: c.score })),
        };
      } catch (err) {
        console.error(`[competitors] ${domain} failed:`, err);
        return { domain, error: err instanceof Error ? err.message : "Couldn't audit this website." };
      }
    }),
  );
}
