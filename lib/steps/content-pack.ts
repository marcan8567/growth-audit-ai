import "server-only";
import type { z } from "zod";
import { runJsonStep } from "@/lib/ai/run-step";
import { languageRule } from "@/prompts/shared";
import type { Lang } from "@/lib/i18n";
import { formatWebsiteForPrompt } from "@/lib/reader/format";
import type { WebsiteData } from "@/lib/reader/types";
import { ContentPackSchema, type ContentPack } from "@/lib/schemas/content-pack";
import { CONTENT_PACK_SYSTEM, contentPackUserPrompt } from "@/prompts/content-pack";
import type { BrandVoiceResult } from "./brand-voice";

/**
 * Content sample: three content themes and two short ready-to-post posts (LinkedIn and X), in the brand voice.
 * Runs after the brand voice step, because it needs it. The full content plan is offered via LinkedIn.
 */
export async function runContentPack(site: WebsiteData, brandVoice: BrandVoiceResult, lang: Lang = "en"): Promise<ContentPack> {
  // Only the profile is passed on; the grounding details are for the report, not the writer.
  const { tone, toneSummary, audience, positioning, keyMessages, wordsTheyUse, wordsToAvoid } = brandVoice.profile;
  const voice = JSON.stringify({ tone, toneSummary, audience, positioning, keyMessages, wordsTheyUse, wordsToAvoid }, null, 2);

  return runJsonStep<ContentPack>({
    name: "Social media post",
    system: CONTENT_PACK_SYSTEM,
    user: contentPackUserPrompt(formatWebsiteForPrompt(site), voice) + languageRule(lang),
    schema: ContentPackSchema as z.ZodType<ContentPack>,
    tier: "smart",
    maxTokens: 2_500,
  });
}
