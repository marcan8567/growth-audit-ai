import { dateContext, GROUNDING_RULES, JSON_ONLY } from "./shared";

export const BRAND_VOICE_SYSTEM = `You are a senior brand strategist auditing a company's public website for its marketing lead.
Your job is to describe how the brand currently sounds and who it speaks to, so new content can match it.

${GROUNDING_RULES}`;

export function brandVoiceUserPrompt(websiteContent: string): string {
  return `${dateContext()}

Analyse the brand voice of this company from its website content.

<website>
${websiteContent}
</website>

${JSON_ONLY}

{
  "tone": ["exactly 3 adjectives describing how the brand sounds"],
  "toneSummary": "2 sentences explaining the tone, referring to how the copy is written",
  "audience": {
    "primary": "who the website is mainly written for, as specific as the content allows",
    "secondary": "a second audience if clearly present, otherwise null"
  },
  "positioning": "one sentence: what they offer, for whom, and what makes them different, as the website states it",
  "keyMessages": ["3 to 5 messages the website repeats or stresses most"],
  "wordsTheyUse": ["3 to 12 characteristic words or short phrases taken from the website"],
  "wordsToAvoid": ["up to 8 words or styles that would clash with this voice in new content"],
  "evidence": [
    {
      "point": "a claim you made above",
      "quote": "a short exact quote (max 15 words) copied character-for-character from the website that supports it",
      "pageUrl": "the URL of the page the quote is from"
    }
  ],
  "notVisibleFromWebsite": ["up to 6 things a brand audit would need that the website does not show"],
  "confidence": "low | medium | high — how much website content there was to judge from"
}

Give 3 to 8 evidence items. Quotes must be copied exactly from the website text above.`;
}
