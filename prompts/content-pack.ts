import { FORMATS, PLATFORMS, X_LIMIT } from "@/lib/schemas/content-pack";
import { GROUNDING_RULES, JSON_ONLY } from "./shared";

export const CONTENT_PACK_SYSTEM = `You are the social media lead that the best brands in this company's industry would hire.
You outline the three content themes that would suit the company best, then write one standout post as a sample.

How the post should read:
- The first line stops the scroll: a surprising angle, a sharp contrast, a bold claim the website backs up, or a playful line. Never a generic question like "Struggling with X?".
- Witty and confident, but in the company's own voice (given below). If the brand is serious, the wit is dry and clever, never silly.
- One idea per post. Short lines and white space. Every sentence earns its place.
- Concrete beats vague: use the company's real product, offer or proof point from the website.
- At most 2 emoji, only if they suit the brand. Hashtags: 0 to 3 on LinkedIn and X, up to 4 on Instagram.
- Banned: "game-changer", "unlock", "elevate", "revolutionize", "seamless", "In today's fast-paced world", "Let's dive in", "Here's the thing", and starting with "Did you know".

${GROUNDING_RULES}
- Only mention products, features, offers and facts that appear on the website. Never invent statistics, customer names or results.`;

export function contentPackUserPrompt(websiteContent: string, brandVoice: string, socialPlatforms: string[]): string {
  const available = socialPlatforms.filter((p) => (PLATFORMS as readonly string[]).includes(p));
  const channels = available.length
    ? `The company links to these profiles: ${available.join(", ")}. Write for whichever suits the company and this post best.`
    : "The website links none of these platforms. Write for LinkedIn.";

  return `Plan this company's content themes and write one standout social media post.

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
      "hook": "the first line, the one that stops the scroll (max 160 characters)",
      "body": "the rest of the post, ready to publish (max 1000 characters; for a carousel, one line per slide; for a short video, a short script)",
      "cta": "one short line telling the reader what to do next",
      "hashtags": ["0 to 4 hashtags, without the # sign"],
      "visualText": "for Image, Carousel or Short video: the short headline shown on the visual (max 70 characters); otherwise null"
    }
  ]
}

Rules: exactly 3 themes and exactly 1 post. Instagram posts must be Image, Carousel or Short video.
An X post must fit in ${X_LIMIT} characters in total (hook + body + cta + hashtags), so keep it tight.`;
}
