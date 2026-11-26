/**
 * Rules shared by every AI step. Kept in one place so all steps stay consistent
 * and the grounding rules can be shown and explained in interviews.
 */
export const GROUNDING_RULES = `Rules:
- Base every statement only on the website content provided. Do not use outside knowledge about the company.
- If something cannot be judged from the public website, say "not visible from the website" instead of guessing.
- Never invent numbers, customers, awards, team members or claims.
- Write for a marketing lead: specific, plain English, no buzzwords.`;

export const JSON_ONLY = `Reply with ONLY a valid JSON object that matches the schema below. No markdown, no code fences, no text before or after it.`;

/**
 * Today's date, given to every step. AI models don't know the current date (their knowledge stops
 * at a cutoff), so without this a recent date on a website can look like a "future date" error.
 * It goes in the user message, not the system prompt, so the system prompt stays identical (cacheable).
 */
export function dateContext(now = new Date()): string {
  const today = now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return `Today's date is ${today}. Dates on the website up to today are current, not errors or future dates. Don't comment on dates unless one is clearly wrong compared with today.`;
}

/**
 * The report language. Added to the end of every step's user prompt (so the system prompts stay
 * identical and cacheable). JSON keys and fixed values stay English, so the Zod schemas still apply,
 * and quotes stay word for word, so the grounding check still works.
 */
export function languageRule(lang: "en" | "es" | "de"): string {
  if (lang === "en") return "";
  const name = lang === "es" ? "Spanish (as used in Spain)" : "German (as used in Germany, formal \"Sie\")";
  const market = lang === "es" ? "Spain" : "Germany";
  return `

Language: write every text value in ${name}, in plain language for a business reader (this replaces "plain English" in the rules).
- Keep JSON keys and fixed values exactly as specified in English (for example "high", "low", "commercial", "LinkedIn", "X", "Text post").
- Quotes from the website stay word for word in the website's own language; never translate a quote.
- Keywords that must appear on the website stay exactly as written there. New keyword suggestions and hashtags use the phrases people in ${market} actually search for and use, in ${name.split(" ")[0]}.`;
}
