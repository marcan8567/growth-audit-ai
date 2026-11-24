import { z } from "zod";

/** The exact shape the brand voice step must return. Anything else is rejected and retried. */
export const BrandVoiceSchema = z.object({
  tone: z.array(z.string().min(1)).length(3),
  toneSummary: z.string().min(1),
  audience: z.object({
    primary: z.string().min(1),
    secondary: z.string().nullable(),
  }),
  positioning: z.string().min(1),
  keyMessages: z.array(z.string().min(1)).min(3).max(5),
  wordsTheyUse: z.array(z.string().min(1)).min(3).max(12),
  wordsToAvoid: z.array(z.string().min(1)).max(8),
  evidence: z
    .array(
      z.object({
        point: z.string().min(1),
        quote: z.string().min(1),
        pageUrl: z.string().min(1),
      }),
    )
    .min(3)
    .max(8),
  notVisibleFromWebsite: z.array(z.string()).max(6),
  confidence: z.enum(["low", "medium", "high"]),
});

export type BrandVoice = z.infer<typeof BrandVoiceSchema>;
