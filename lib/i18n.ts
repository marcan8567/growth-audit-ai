/**
 * Report languages. The AI writes in the chosen language, code-generated checks are written in it,
 * and the report's own labels are translated (lib/report-text.ts). Quotes stay in the website's language.
 */
export const LANGS = ["en", "es", "de"] as const;
export type Lang = (typeof LANGS)[number];

export const LANG_NAMES: Record<Lang, string> = { en: "English", es: "Español", de: "Deutsch" };

/** For dates and numbers. */
export const LOCALES: Record<Lang, string> = { en: "en-GB", es: "es-ES", de: "de-DE" };

export function parseLang(value: unknown): Lang {
  return typeof value === "string" && (LANGS as readonly string[]).includes(value) ? (value as Lang) : "en";
}
