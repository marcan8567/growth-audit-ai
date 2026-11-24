import type { WebsiteData } from "./types";

const MAX_PROMPT_CHARS = 28_000; // roughly 7,000 tokens of website content

/** Lays the website out as clearly labelled sections, so the AI can cite which page a fact came from. */
export function formatWebsiteForPrompt(site: WebsiteData): string {
  const sections = site.pages.map((page) => {
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
