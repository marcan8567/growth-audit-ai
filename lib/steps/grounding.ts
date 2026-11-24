import { websiteCorpus } from "@/lib/reader/format";
import type { WebsiteData } from "@/lib/reader/types";

/**
 * The grounding check: is each quote the AI gave really on the website, word for word?
 * Shared by every step that cites evidence.
 */
export function verifyQuotes<T extends { quote: string }>(site: WebsiteData, items: T[]): (T & { verified: boolean })[] {
  const corpus = normalize(websiteCorpus(site));
  return items.map((item) => ({ ...item, verified: corpus.includes(normalize(item.quote)) }));
}

/** Compare words only: ignore case, punctuation, curly quotes and spacing. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
