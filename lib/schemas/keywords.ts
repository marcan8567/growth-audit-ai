import { z } from "zod";

export const SEARCH_INTENTS = ["informational", "commercial", "transactional", "navigational"] as const;

// A search phrase: 1 to 5 words, the way people type it into Google.
const Phrase = z
  .string()
  .trim()
  .min(2)
  .max(60)
  .refine((k) => k.split(/\s+/).length <= 5, "a keyword must be 1 to 5 words");

/** What the AI returns. Where each keyword appears is then measured by code (lib/steps/keywords.ts). */
export const KeywordsSchema = z.object({
  summary: z.string().min(1),
  current: z
    .array(z.object({ keyword: Phrase, intent: z.enum(SEARCH_INTENTS) }))
    .min(3)
    .max(6),
  // A suggestion longer than 5 words is dropped instead of costing a retry; at least 3 must remain.
  suggested: z
    .array(z.object({ keyword: z.string().trim().min(2).max(80), intent: z.enum(SEARCH_INTENTS), why: z.string().min(1) }))
    .min(3)
    .max(6)
    .transform((items) => items.filter((k) => k.keyword.split(/\s+/).length <= 5).slice(0, 5))
    .refine((items) => items.length >= 3, "give 5 suggested keywords of 1 to 5 words each"),
});

export type KeywordsAnswer = z.infer<typeof KeywordsSchema>;
