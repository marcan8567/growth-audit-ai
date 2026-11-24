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
