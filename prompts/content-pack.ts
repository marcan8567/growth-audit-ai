import { FORMATS, PLATFORMS } from "@/lib/schemas/content-pack";
import { GROUNDING_RULES, JSON_ONLY } from "./shared";

export const CONTENT_PACK_SYSTEM = `You are a senior content marketer writing a two-week content plan for a company.
Every post must sound like the company's own brand voice (given below) and be ready to publish with light editing.

${GROUNDING_RULES}
- Only mention products, features, offers and facts that appear on the website. Never invent statistics, customer names or results.`;

export function contentPackUserPrompt(websiteContent: string, brandVoice: string, socialPlatforms: string[]): string {
  const channels = socialPlatforms.length
    ? `The company links to these social profiles: ${socialPlatforms.join(", ")}. Focus on those, plus Blog or Newsletter where useful.`
    : "The website links no social profiles. Use LinkedIn plus Blog or Newsletter.";

  return `Write a 14-day content pack for this company.

<brand_voice>
${brandVoice}
</brand_voice>

<website>
${websiteContent}
</website>

${channels}

${JSON_ONLY}

{
  "strategy": "2 sentences: who this content is for and what it should achieve",
  "pillars": [{ "name": "short pillar name", "why": "one sentence on why this theme matters for this company" }],
  "posts": [
    {
      "day": 1,
      "platform": "one of: ${PLATFORMS.join(", ")}",
      "format": "one of: ${FORMATS.join(", ")}",
      "pillar": "one of the pillar names, exactly as written above",
      "hook": "the first line, written to stop the scroll (max 160 characters)",
      "body": "the post itself, ready to publish (max 1000 characters; for videos, a short script; for carousels, slide-by-slide text)",
      "cta": "what the reader should do next",
      "hashtags": ["0 to 5 relevant hashtags, without the # sign"]
    }
  ]
}

Give exactly 3 pillars and exactly 14 posts, one for each day from 1 to 14. Mix formats and pillars across the two weeks.`;
}
