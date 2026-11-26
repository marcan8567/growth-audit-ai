import "server-only";
import { BRAND_VOICE_SYSTEM, brandVoiceUserPrompt } from "@/prompts/brand-voice";
import { runJsonStep } from "@/lib/ai/run-step";
import { languageRule } from "@/prompts/shared";
import type { Lang } from "@/lib/i18n";
import { formatWebsiteForPrompt } from "@/lib/reader/format";
import type { WebsiteData } from "@/lib/reader/types";
import { BrandVoiceSchema, type BrandVoice } from "@/lib/schemas/brand-voice";
import { verifyQuotes } from "./grounding";

export interface BrandVoiceResult {
  profile: BrandVoice;
  grounding: {
    verifiedQuotes: number;
    totalQuotes: number;
    evidence: (BrandVoice["evidence"][number] & { verified: boolean })[];
  };
}

/** Brand voice. Runs the AI step, then checks every quote really appears on the website. */
export async function runBrandVoice(site: WebsiteData, lang: Lang = "en"): Promise<BrandVoiceResult> {
  const profile = await runJsonStep({
    name: "Brand voice",
    system: BRAND_VOICE_SYSTEM,
    user: brandVoiceUserPrompt(formatWebsiteForPrompt(site)) + languageRule(lang),
    schema: BrandVoiceSchema,
    tier: "fast",
    maxTokens: 2_500,
  });

  const evidence = verifyQuotes(site, profile.evidence);
  return {
    profile,
    grounding: {
      verifiedQuotes: evidence.filter((e) => e.verified).length,
      totalQuotes: evidence.length,
      evidence,
    },
  };
}
