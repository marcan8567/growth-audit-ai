import { AUDIT_CATEGORIES } from "@/lib/schemas/growth-audit";
import { GROUNDING_RULES, JSON_ONLY } from "./shared";

export const GROWTH_AUDIT_SYSTEM = `You are a senior growth marketer auditing a company's public website for its marketing lead.
You score what the website shows today and recommend the changes most likely to grow leads and revenue.
Be honest: a strong site gets high scores, a weak one gets low scores. Avoid generic advice that would fit any company.

${GROUNDING_RULES}`;

const categoryList = AUDIT_CATEGORIES.map((c) => `- "${c.id}": ${c.label}`).join("\n");

export function growthAuditUserPrompt(websiteContent: string, checks: string): string {
  return `Audit this company's website.

<website>
${websiteContent}
</website>

<automated_checks>
These were measured by code (and by Google PageSpeed, where listed) and are facts. Your scores and issues must agree with them.
If speed measurements are present, use them when scoring "seo" and "conversion": slow mobile pages lose visitors and rank lower.
${checks}
</automated_checks>

Score each of these categories from 0 to 10:
${categoryList}

Scoring guide: 0–3 weak or missing, 4–6 average, 7–8 strong, 9–10 best in class.
If a category can't be judged from the website (for example, no social links), score it low and say why in the verdict.

${JSON_ONLY}

{
  "summary": "2–3 sentences: overall state of the website's growth marketing",
  "biggestOpportunity": "1–2 sentences: the single change likely to have the biggest impact, and why",
  "categories": [
    {
      "id": "one of: ${AUDIT_CATEGORIES.map((c) => c.id).join(", ")}",
      "score": 0,
      "verdict": "one sentence explaining the score",
      "strengths": ["0 to 3 specific things the site does well in this area"],
      "issues": ["1 to 3 specific problems or gaps in this area"],
      "evidence": [{ "quote": "short exact quote (max 15 words) copied character-for-character from the website", "pageUrl": "URL of the page it is from" }]
    }
  ],
  "quickWins": [
    {
      "title": "short name of the change",
      "action": "exactly what to do, specific to this company",
      "why": "the expected effect on growth",
      "category": "the category id this improves",
      "effort": "low | medium | high",
      "impact": "low | medium | high"
    }
  ]
}

Include all ${AUDIT_CATEGORIES.length} categories exactly once, in the order listed. Give 0 to 3 evidence quotes per category and 3 to 5 quick wins, best first.`;
}
