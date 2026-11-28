import type { WebsiteData } from "./types";

const MAX_PROMPT_CHARS = 28_000; // roughly 7,000 tokens of website content

/**
 * Lays the website out as clearly labelled sections, so the AI can cite which page a fact came from.
 * Text that repeats (a "book a call" band on every page, a cookie notice) is sent only once, which makes
 * every AI step cheaper. The quote check still uses the full, untrimmed text (websiteCorpus).
 */
export function formatWebsiteForPrompt(site: WebsiteData, { dedupe = true } = {}): string {
  const texts = dedupe ? withoutRepeats(site.pages.map((p) => p.text)) : site.pages.map((p) => p.text);
  const sections = site.pages.map((original, i) => {
    const page = { ...original, text: texts[i] };
    const headings = page.headings.map((h) => `  h${h.level}: ${h.text}`).join("\n");
    return [
      `### PAGE (${page.kind}): ${page.url}`,
      `Title: ${page.title || "(none)"}`,
      `Meta description: ${page.metaDescription || "(none)"}`,
      `Headings:\n${headings || "  (none)"}`,
      `Calls to action: ${page.ctas.join(" | ") || "(none found)"}`,
      `Text:\n${page.text || "(no readable text)"}`,
    ].join("\n");
  });

  const socials = site.socialLinks.length
    ? site.socialLinks.map((s) => `${s.platform}: ${s.url}`).join("\n")
    : "(none linked from the website)";

  const body = `Company website: ${site.finalUrl}\n\n${sections.join("\n\n")}\n\n### SOCIAL PROFILES LINKED\n${socials}`;
  return body.length > MAX_PROMPT_CHARS ? `${body.slice(0, MAX_PROMPT_CHARS)}\n[...content truncated]` : body;
}

/** A run of this many words that already appeared earlier counts as a repeat. Short phrases are never removed. */
const REPEAT_WORDS = 12;

/**
 * Removes passages that already appeared earlier, on the same page or a page before it, and marks the
 * gap with "…". Works on runs of 12+ identical words (ignoring case and punctuation), because the page
 * text arrives as one continuous string without reliable sentence breaks.
 */
export function withoutRepeats(texts: string[]): string[] {
  const seen = new Set<string>();
  const norm = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
  return texts.map((text) => {
    const words = text.split(/\s+/).filter(Boolean);
    const keys = words.map(norm);
    const drop = new Array<boolean>(words.length).fill(false);
    for (let i = 0; i + REPEAT_WORDS <= words.length; i++) {
      const run = keys.slice(i, i + REPEAT_WORDS).join(" ");
      if (seen.has(run)) drop.fill(true, i, i + REPEAT_WORDS);
      seen.add(run); // repeats within the same page count too
    }
    const out: string[] = [];
    words.forEach((word, i) => {
      if (!drop[i]) out.push(word);
      else if (!drop[i - 1]) out.push("…");
    });
    return out.join(" ");
  });
}

/** All the words that appear on the website, used to check the AI's quotes are real. */
export function websiteCorpus(site: WebsiteData): string {
  return site.pages
    .flatMap((p) => [p.title, p.metaDescription, ...p.headings.map((h) => h.text), ...p.ctas, p.text])
    .join(" ");
}

/** A light summary for the browser — the full page text stays on the server. */
export function summarizeWebsite(site: WebsiteData) {
  return {
    finalUrl: site.finalUrl,
    domain: site.domain,
    fetchedAt: site.fetchedAt,
    pages: site.pages.map((p) => ({
      kind: p.kind,
      url: p.url,
      title: p.title,
      metaDescription: p.metaDescription,
      headings: p.headings.slice(0, 8),
      ctas: p.ctas,
      wordCount: p.wordCount,
      textPreview: p.text.slice(0, 280),
    })),
    socialLinks: site.socialLinks,
    brand: site.brand,
    failedPages: site.failedPages,
  };
}

export type WebsiteSummary = ReturnType<typeof summarizeWebsite>;
