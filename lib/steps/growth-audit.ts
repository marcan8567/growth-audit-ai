import "server-only";
import { runJsonStep } from "@/lib/ai/run-step";
import { languageRule } from "@/prompts/shared";
import type { Lang } from "@/lib/i18n";
import { formatChecksForPrompt, type SiteCheck } from "@/lib/reader/checks";
import { formatWebsiteForPrompt } from "@/lib/reader/format";
import type { WebsiteData } from "@/lib/reader/types";
import { AUDIT_CATEGORIES, GrowthAuditSchema, type GrowthAudit } from "@/lib/schemas/growth-audit";
import { GROWTH_AUDIT_SYSTEM, growthAuditUserPrompt } from "@/prompts/growth-audit";
import { verifyQuotes } from "./grounding";

type Category = GrowthAudit["categories"][number];

export interface GrowthAuditResult {
  /** 0–100, calculated by code from the category scores (the AI never does the maths). */
  overallScore: number;
  grade: "Weak" | "Average" | "Strong" | "Excellent";
  summary: string;
  biggestOpportunity: string;
  categories: (Omit<Category, "evidence"> & {
    label: string;
    evidence: (Category["evidence"][number] & { verified: boolean })[];
  })[];
  quickWins: GrowthAudit["quickWins"];
  /** Set when a visitor sees the report: how many quick wins were left out (see lib/report-access.ts). */
  hiddenQuickWins?: number;
  grounding: { verifiedQuotes: number; totalQuotes: number };
}

/** Growth audit: the AI scores six categories; code orders them, averages them and checks every quote. */
export async function runGrowthAudit(site: WebsiteData, checks: SiteCheck[], lang: Lang = "en"): Promise<GrowthAuditResult> {
  const audit = await runJsonStep({
    name: "Growth audit",
    system: GROWTH_AUDIT_SYSTEM,
    user: growthAuditUserPrompt(formatWebsiteForPrompt(site), formatChecksForPrompt(checks)) + languageRule(lang),
    schema: GrowthAuditSchema,
    tier: "smart",
    maxTokens: 4_000,
  });

  // Always show categories in the same order, whatever order the AI used.
  const categories = AUDIT_CATEGORIES.map(({ id, label }) => {
    const category = audit.categories.find((c) => c.id === id)!; // the schema guarantees each id is present
    return { ...category, label, evidence: verifyQuotes(site, category.evidence) };
  });

  const average = categories.reduce((sum, c) => sum + c.score, 0) / categories.length;
  const overallScore = Math.round(average * 10);
  const allEvidence = categories.flatMap((c) => c.evidence);

  return {
    overallScore,
    grade: overallScore >= 85 ? "Excellent" : overallScore >= 70 ? "Strong" : overallScore >= 45 ? "Average" : "Weak",
    summary: audit.summary,
    biggestOpportunity: audit.biggestOpportunity,
    categories,
    quickWins: audit.quickWins,
    grounding: { verifiedQuotes: allEvidence.filter((e) => e.verified).length, totalQuotes: allEvidence.length },
  };
}
