import "server-only";
import { runJsonStep } from "@/lib/ai/run-step";
import { formatWebsiteForPrompt } from "@/lib/reader/format";
import type { WebsiteData } from "@/lib/reader/types";
import { ContentPackSchema, type ContentPack } from "@/lib/schemas/content-pack";
import { CONTENT_PACK_SYSTEM, contentPackUserPrompt } from "@/prompts/content-pack";
import type { BrandVoiceResult } from "./brand-voice";

/**
 * Content sample: three content themes and two short ready-to-post posts (LinkedIn and X), in the brand voice.
 * Runs after the brand voice step, because it needs it. The full content plan is offered via LinkedIn.
 */
export async function runContentPack(site: WebsiteData, brandVoice: BrandVoiceResult): Promise<ContentPack> {
  // Only the profile is passed on; the grounding details are for the report, not the writer.
  const { tone, toneSummary, audience, positioning, keyMessages, wordsTheyUse, wordsToAvoid } = brandVoice.profile;
  const voice = JSON.stringify({ tone, toneSummary, audience, positioning, keyMessages, wordsTheyUse, wordsToAvoid }, null, 2);

  return runJsonStep({
    name: "Social media post",
    system: CONTENT_PACK_SYSTEM,
    user: contentPackUserPrompt(formatWebsiteForPrompt(site), voice),
    schema: ContentPackSchema,
    tier: "smart",
    maxTokens: 2_500,
  });
}
