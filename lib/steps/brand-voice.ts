import "server-only";
import { BRAND_VOICE_SYSTEM, brandVoiceUserPrompt } from "@/prompts/brand-voice";
import { runJsonStep } from "@/lib/ai/run-step";
import { formatWebsiteForPrompt, websiteCorpus } from "@/lib/reader/format";
import type { WebsiteData } from "@/lib/reader/types";
import { BrandVoiceSchema, type BrandVoice } from "@/lib/schemas/brand-voice";

export interface BrandVoiceResult {
  profile: BrandVoice;
  grounding: {
    verifiedQuotes: number;
    totalQuotes: number;
    evidence: (BrandVoice["evidence"][number] & { verified: boolean })[];
  };
}

/** Step 2: brand voice. Runs the AI step, then checks every quote really appears on the website. */
export async function runBrandVoice(site: WebsiteData): Promise<BrandVoiceResult> {
  const profile = await runJsonStep({
    name: "Brand voice",
    system: BRAND_VOICE_SYSTEM,
    user: brandVoiceUserPrompt(formatWebsiteForPrompt(site)),
    schema: BrandVoiceSchema,
    maxTokens: 2_500,
  });

  const corpus = normalize(websiteCorpus(site));
  const evidence = profile.evidence.map((item) => ({ ...item, verified: corpus.includes(normalize(item.quote)) }));

  return {
    profile,
    grounding: {
      verifiedQuotes: evidence.filter((e) => e.verified).length,
      totalQuotes: evidence.length,
      evidence,
    },
  };
}

/** Compare words only: ignore case, punctuation, curly quotes and spacing. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
