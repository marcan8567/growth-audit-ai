import { z } from "zod";

/** The six areas every audit scores. Fixed in code so every report has the same structure. */
export const AUDIT_CATEGORIES = [
  { id: "messaging", label: "Value proposition & messaging" },
  { id: "conversion", label: "Conversion & calls to action" },
  { id: "seo", label: "SEO basics" },
  { id: "content", label: "Content & thought leadership" },
  { id: "social", label: "Social presence" },
  { id: "trust", label: "Trust & social proof" },
] as const;

const categoryIds = AUDIT_CATEGORIES.map((c) => c.id) as [string, ...string[]];
const CategoryId = z.enum(categoryIds as ["messaging", "conversion", "seo", "content", "social", "trust"]);
const Level = z.enum(["low", "medium", "high"]);

export const GrowthAuditSchema = z.object({
  summary: z.string().min(1),
  biggestOpportunity: z.string().min(1),
  categories: z
    .array(
      z.object({
        id: CategoryId,
        score: z.number().int().min(0).max(10),
        verdict: z.string().min(1),
        strengths: z.array(z.string().min(1)).max(3),
        issues: z.array(z.string().min(1)).min(1).max(3),
        evidence: z
          .array(z.object({ quote: z.string().min(1), pageUrl: z.string().min(1) }))
          .max(3),
      }),
    )
    .length(AUDIT_CATEGORIES.length)
    .superRefine((categories, ctx) => {
      const seen = new Set(categories.map((c) => c.id));
      for (const { id } of AUDIT_CATEGORIES) {
        if (!seen.has(id)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `missing category "${id}"; include each category exactly once` });
      }
    }),
  quickWins: z
    .array(
      z.object({
        title: z.string().min(1),
        action: z.string().min(1),
        why: z.string().min(1),
        category: CategoryId,
        effort: Level,
        impact: Level,
      }),
    )
    .min(3)
    .max(5),
});

export type GrowthAudit = z.infer<typeof GrowthAuditSchema>;
export type AuditCategoryId = GrowthAudit["categories"][number]["id"];
