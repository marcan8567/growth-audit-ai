import { FORMATS, LINKEDIN_LIMIT, X_LIMIT } from "@/lib/schemas/content-pack";
import { dateContext, GROUNDING_RULES, JSON_ONLY } from "./shared";

export const CONTENT_PACK_SYSTEM = `You are the social media lead that the best brands in this company's industry would hire.
You outline the three content themes that would suit the company best, then write two short standout posts as a sample: one for LinkedIn, one for X.

How the posts should read:
- The first line stops the scroll: a surprising angle, a sharp contrast, a bold claim the website backs up, or a playful line. Never a generic question like "Struggling with X?".
- Witty and confident, but in the company's own voice (given below). If the brand is serious, the wit is dry and clever, never silly.
- Short. One idea per post. Short lines and white space. Every sentence earns its place.
- Concrete beats vague: use the company's real product, offer or proof point from the website.
- Each post fits its platform: LinkedIn is a sharp professional insight; X is punchier, like a one-liner with a twist.
- The two posts take different angles, ideally from different themes.
- At most 1 emoji per post, only if it suits the brand. Hashtags: 0 to 2.
- Banned: "game-changer", "unlock", "elevate", "revolutionize", "seamless", "In today's fast-paced world", "Let's dive in", "Here's the thing", "stop the madness", and starting with "Did you know".

${GROUNDING_RULES}
- Only mention products, features, offers and facts that appear on the website. Never invent statistics, customer names or results.`;

export function contentPackUserPrompt(websiteContent: string, brandVoice: string): string {
  return `${dateContext()}

Plan this company's content themes and write two short posts: one for LinkedIn, one for X.

<brand_voice>
${brandVoice}
</brand_voice>

<website>
${websiteContent}
</website>

${JSON_ONLY}

{
  "strategy": "2 sentences: who this company's content should speak to and what it should achieve",
  "pillars": [{ "name": "short theme name", "why": "one sentence on why this theme matters for this company" }],
  "posts": [
    {
      "platform": "LinkedIn",
      "format": "one of: ${FORMATS.join(", ")}",
      "pillar": "one of the theme names, exactly as written above",
      "hook": "the first line, the one that stops the scroll (max 140 characters)",
      "body": "the rest of the post (max 450 characters)",
      "cta": "one short line telling the reader what to do next",
      "hashtags": ["0 to 2 hashtags, without the # sign"],
      "visualText": "for Image: the short headline shown on the image (max 70 characters); otherwise null"
    },
    { "platform": "X", "...": "same fields" }
  ]
}

Rules: exactly 3 themes and exactly 2 posts, LinkedIn first, then X.
The LinkedIn post must be at most ${LINKEDIN_LIMIT} characters in total and the X post at most ${X_LIMIT} (hook + body + cta + hashtags).`;
}
