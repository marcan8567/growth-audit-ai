import { FORMATS, PLATFORMS } from "@/lib/schemas/content-pack";
import { GROUNDING_RULES, JSON_ONLY } from "./shared";

export const CONTENT_PACK_SYSTEM = `You are a senior content marketer.
You outline the three content themes that would suit a company best, then write one excellent social media post as a sample.
The post must sound like the company's own brand voice (given below) and be ready to publish with light editing.

${GROUNDING_RULES}
- Only mention products, features, offers and facts that appear on the website. Never invent statistics, customer names or results.`;

export function contentPackUserPrompt(websiteContent: string, brandVoice: string, socialPlatforms: string[]): string {
  const channels = socialPlatforms.length
    ? `The company links to these social profiles: ${socialPlatforms.join(", ")}. Write the post for whichever of these suits the company best.`
    : "The website links no social profiles. Write the post for LinkedIn.";

  return `Plan this company's content themes and write one sample social media post.

<brand_voice>
${brandVoice}
</brand_voice>

<website>
${websiteContent}
</website>

${channels}

${JSON_ONLY}

{
  "strategy": "2 sentences: who this company's content should speak to and what it should achieve",
  "pillars": [{ "name": "short theme name", "why": "one sentence on why this theme matters for this company" }],
  "posts": [
    {
      "platform": "one of: ${PLATFORMS.join(", ")}",
      "format": "one of: ${FORMATS.join(", ")}",
      "pillar": "one of the theme names, exactly as written above",
      "hook": "the first line, written to stop the scroll (max 160 characters)",
      "body": "the post itself, ready to publish (max 1000 characters; for videos, a short script; for carousels, slide-by-slide text)",
      "cta": "what the reader should do next",
      "hashtags": ["0 to 5 relevant hashtags, without the # sign"]
    }
  ]
}

Give exactly 3 themes and exactly 1 post: the single post most likely to perform well for this company.`;
}
