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
