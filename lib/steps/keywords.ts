import "server-only";
import { runJsonStep } from "@/lib/ai/run-step";
import { formatWebsiteForPrompt } from "@/lib/reader/format";
import type { WebsiteData } from "@/lib/reader/types";
import { KeywordsSchema, type KeywordsAnswer } from "@/lib/schemas/keywords";
import { KEYWORDS_SYSTEM, keywordsUserPrompt } from "@/prompts/keywords";

/** Where a keyword appears, measured by code on the pages that were read. */
export interface KeywordPlacement {
  title: boolean; // homepage <title>
  h1: boolean; // homepage main heading
  headings: boolean; // any other heading on any page read
  meta: boolean; // homepage meta description
  url: boolean; // any page address read
  mentions: number; // times it appears across all pages read
}

export interface KeywordsResult {
  summary: string;
  current: (KeywordsAnswer["current"][number] & { placement: KeywordPlacement })[];
  suggested: (KeywordsAnswer["suggested"][number] & { onSite: boolean })[];
  /** Current keywords the AI named that code couldn't find on the site, so they were left out. */
  dropped: number;
}

/**
 * Keyword focus: the AI names the phrases the site targets and suggests new ones; code then checks where
 * each phrase really appears (title, main heading, headings, meta description, page addresses) and drops
 * "current" keywords that aren't on the site at all. These are not Google rankings.
 */
export async function runKeywords(site: WebsiteData): Promise<KeywordsResult> {
  const answer = await runJsonStep({
    name: "Keywords",
    system: KEYWORDS_SYSTEM,
    user: keywordsUserPrompt(formatWebsiteForPrompt(site)),
    schema: KeywordsSchema,
    tier: "fast",
    maxTokens: 1_500,
  });

  const placed = answer.current.map((k) => ({ ...k, keyword: k.keyword.toLowerCase(), placement: placementOf(site, k.keyword) }));
  const current = placed.filter((k) => k.placement.mentions > 0);
  const known = new Set(current.map((k) => k.keyword));
  const suggested = answer.suggested
    .map((k) => ({ ...k, keyword: k.keyword.toLowerCase() }))
    .filter((k) => !known.has(k.keyword))
    .map((k) => ({ ...k, onSite: placementOf(site, k.keyword).mentions > 0 }));

  return { summary: answer.summary, current, suggested, dropped: placed.length - current.length };
}

export function placementOf(site: WebsiteData, keyword: string): KeywordPlacement {
  const pattern = keywordPattern(keyword);
  const count = (text: string) => (text.match(pattern) ?? []).length;
  const home = site.pages.find((p) => p.kind === "home") ?? site.pages[0];
  const h1 = home?.headings.filter((h) => h.level === 1).map((h) => h.text).join(" ") ?? "";
  const otherHeadings = site.pages.flatMap((p) => p.headings.filter((h) => p !== home || h.level !== 1).map((h) => h.text)).join(" \n ");
  const urls = site.pages.map((p) => decodeURIComponent(new URL(p.url).pathname).replace(/[-_/]+/g, " ")).join(" \n ");
  const mentions = site.pages.reduce((n, p) => n + count(`${p.title} \n ${p.metaDescription} \n ${p.text}`), 0);

  return {
    title: count(home?.title ?? "") > 0,
    h1: count(h1) > 0,
    headings: count(otherHeadings) > 0,
    meta: count(home?.metaDescription ?? "") > 0,
    url: count(urls) > 0,
    mentions,
  };
}

/**
 * Matches a phrase as whole words, ignoring case, with any spacing, hyphen or punctuation between words
 * and an optional plural on the last word ("ai agent" matches "AI agents" and "AI-agent").
 */
function keywordPattern(keyword: string): RegExp {
  const words = keyword
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!words.length) return /$^/;
  const last = words.length - 1;
  const body = words
    .map((w, i) => (w === "and" ? "(?:and|&)" : i === last ? `${w.replace(/s$/, "")}(?:s|es)?` : w)) // "and" also matches "&"
    .join("[^\\p{L}\\p{N}]+");
  return new RegExp(`(?<![\\p{L}\\p{N}])${body}(?![\\p{L}\\p{N}])`, "giu");
}
