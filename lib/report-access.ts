import type { GrowthAuditResult } from "@/lib/steps/growth-audit";

/**
 * What a visitor may see of a report.
 *
 * Visitors get the whole report except the quick wins: the first one in full (to show the quality),
 * the rest only as a count, shown as blurred placeholders with "message me on LinkedIn for the full list".
 * The hidden text is removed here, on the server, so it never reaches the browser (a CSS blur alone
 * could be undone with the browser's inspector).
 *
 * Audits run with the access code (the owner's showcase) are always shown in full.
 */

/** How many quick wins a visitor sees in full. */
export const VISIBLE_QUICK_WINS = 1;

export function redactAuditForVisitor(audit: GrowthAuditResult): GrowthAuditResult {
  const hidden = Math.max(0, audit.quickWins.length - VISIBLE_QUICK_WINS);
  if (!hidden) return audit;
  return { ...audit, quickWins: audit.quickWins.slice(0, VISIBLE_QUICK_WINS), hiddenQuickWins: hidden };
}

export function redactReportForVisitor<T extends { audit?: GrowthAuditResult }>(report: T): T {
  return report.audit ? { ...report, audit: redactAuditForVisitor(report.audit) } : report;
}
