import "server-only";
import { runJsonStep } from "@/lib/ai/run-step";
import { formatWebsiteForPrompt } from "@/lib/reader/format";
import type { WebsiteData } from "@/lib/reader/types";
import { ContentPackSchema, type ContentPack } from "@/lib/schemas/content-pack";
import { CONTENT_PACK_SYSTEM, contentPackUserPrompt } from "@/prompts/content-pack";
import type { BrandVoiceResult } from "./brand-voice";

/** Content pack: 14 days of posts written in the brand voice. Runs after the brand voice step, because it needs it. */
export async function runContentPack(site: WebsiteData, brandVoice: BrandVoiceResult): Promise<ContentPack> {
  // Only the profile is passed on; the grounding details are for the report, not the writer.
  const { tone, toneSummary, audience, positioning, keyMessages, wordsTheyUse, wordsToAvoid } = brandVoice.profile;
  const voice = JSON.stringify({ tone, toneSummary, audience, positioning, keyMessages, wordsTheyUse, wordsToAvoid }, null, 2);

  const pack = await runJsonStep({
    name: "Content pack",
    system: CONTENT_PACK_SYSTEM,
    user: contentPackUserPrompt(formatWebsiteForPrompt(site), voice, site.socialLinks.map((s) => s.platform)),
    schema: ContentPackSchema,
    maxTokens: 8_000,
  });

  return { ...pack, posts: [...pack.posts].sort((a, b) => a.day - b.day) };
}
