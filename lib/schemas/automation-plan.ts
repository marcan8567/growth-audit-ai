import { z } from "zod";

const Level = z.enum(["low", "medium", "high"]);

export const AutomationPlanSchema = z.object({
  summary: z.string().min(1),
  automations: z
    .array(
      z.object({
        name: z.string().min(1),
        goal: z.string().min(1),
        trigger: z.string().min(1),
        steps: z.array(z.string().min(1)).min(2).max(6),
        tools: z.array(z.string().min(1)).min(1).max(4),
        aiRole: z.string().nullable(),
        metric: z.string().min(1),
        effort: Level,
        impact: Level,
      }),
    )
    .min(4)
    .max(6),
});

export type AutomationPlan = z.infer<typeof AutomationPlanSchema>;
