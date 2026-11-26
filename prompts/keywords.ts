import { dateContext, GROUNDING_RULES, JSON_ONLY } from "./shared";

export const KEYWORDS_SYSTEM = `You are an SEO strategist. You look at a company's website and work out which search phrases it is
built around today, and which phrases its ideal customers search for that it should target next.

${GROUNDING_RULES}
- Keywords are search phrases of 1 to 5 words, written in lowercase the way people type them into Google (for example "ai automation agency", not "AI Automation Agency for Growing Teams").
- "current" keywords must appear on the website word for word (allowing for capital letters and plural forms). Code checks this and drops any that don't.
- "suggested" keywords are phrases the company's buyers plausibly search for, matching what the company really offers. Prefer specific, realistic phrases over very broad ones ("crm automation for sales teams" rather than "automation").`;

export function keywordsUserPrompt(websiteContent: string): string {
  return `${dateContext()}

Analyse this website's keyword focus.

<website>
${websiteContent}
</website>

${JSON_ONLY}

{
  "summary": "1-2 sentences: what the site is optimised around today and the main gap",
  "current": [
    { "keyword": "a search phrase the site clearly targets, appearing on it word for word", "intent": "informational | commercial | transactional | navigational" }
  ],
  "suggested": [
    { "keyword": "a phrase its buyers search for that the site should target", "intent": "informational | commercial | transactional | navigational", "why": "one sentence: who searches it and why it fits this company" }
  ]
}

Give 3 to 6 current keywords (most prominent first) and exactly 5 suggested keywords (most valuable first). Don't repeat a current keyword as a suggestion.`;
}
