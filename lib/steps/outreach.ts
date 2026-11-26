import "server-only";
import { runJsonStep } from "@/lib/ai/run-step";
import type { Lang } from "@/lib/i18n";
import { numbersIn, outreachSchema, type OutreachKit } from "@/lib/schemas/outreach";
import type { SavedReport } from "@/lib/store/reports";
import { languageRule } from "@/prompts/shared";
import { OUTREACH_SYSTEM, outreachUserPrompt } from "@/prompts/outreach";

export interface OutreachInput {
  senderName?: string;
  senderCompany?: string;
  offer?: string;
  contactName?: string;
}

/**
 * The outreach kit: first-contact messages built only from the report. The report passed in must already be
 * what the requester may see (visitors' hidden quick wins removed), so nothing hidden can leak into a message.
 * Every number in a message must appear in the digest (checked by the schema), so results can't be invented.
 */
export async function runOutreach(report: SavedReport, reportUrl: string, input: OutreachInput, lang: Lang): Promise<OutreachKit> {
  const digest = reportDigest(report);
  // The numbers the AI may use: those in the digest, plus the sender's own input (for example "15-minute").
  const allowed = new Set([...numbersIn(digest), ...numbersIn(Object.values(input).join(" ")), "15"]);
  return runJsonStep({
    name: "Outreach kit",
    system: OUTREACH_SYSTEM,
    user: outreachUserPrompt({ digest, reportUrl, ...input }) + languageRule(lang),
    schema: outreachSchema(allowed),
    tier: "fast",
    maxTokens: 2_000,
  });
}

/** The facts from the report the messages may use, as compact text. */
export function reportDigest(report: SavedReport): string {
  const a = report.audit;
  const lines: string[] = [];
  lines.push(`Company: ${report.site?.brand?.name ?? report.site?.domain} (${report.site?.domain})`);
  if (a) {
    lines.push(`Overall growth score: ${a.overallScore}/100 (${a.grade})`, `Summary: ${a.summary}`, `Biggest opportunity: ${a.biggestOpportunity}`);
    lines.push("Scores (0-10):", ...a.categories.map((c) => `- ${c.label}: ${c.score} – ${c.verdict}`));
    lines.push("Quick wins:", ...a.quickWins.map((w) => `- ${w.title}: ${w.action}`));
  }
  const problems = (report.checks ?? []).filter((c) => c.status !== "pass");
  if (problems.length) lines.push("Website checks to fix:", ...problems.map((c) => `- ${c.label}: ${c.detail}`));
  const speed = report.speed;
  if (speed?.scores.performance != null) lines.push(`Google mobile performance score: ${speed.scores.performance}/100`);
  const k = report.keywords;
  if (k?.current.length) {
    const missing = k.current.filter((x) => !x.placement.title && !x.placement.h1).map((x) => x.keyword);
    if (missing.length) lines.push(`Main keywords missing from the homepage title and H1: ${missing.join(", ")}`);
  }
  return lines.join("\n");
}
