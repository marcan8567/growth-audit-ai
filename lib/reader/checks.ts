import type { WebsiteData } from "./types";

/**
 * Website checks done in plain code, with no AI.
 * These are facts (is there a meta description? one H1?) rather than judgements,
 * so code is cheaper, faster and always gives the same answer. The audit step
 * receives them as input and has to agree with them.
 */

export type CheckStatus = "pass" | "warn" | "fail";

export interface SiteCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

export function runSiteChecks(site: WebsiteData): SiteCheck[] {
  const home = site.pages[0];
  const kinds = new Set(site.pages.map((p) => p.kind));
  const checks: SiteCheck[] = [];
  const add = (id: string, label: string, status: CheckStatus, detail: string) =>
    checks.push({ id, label, status, detail });

  add(
    "https",
    "Secure connection (HTTPS)",
    site.finalUrl.startsWith("https://") ? "pass" : "fail",
    site.finalUrl.startsWith("https://") ? "The site loads over HTTPS." : "The site does not load over HTTPS.",
  );

  const titleLength = home.title.length;
  add(
    "title",
    "Homepage title",
    !titleLength ? "fail" : titleLength >= 30 && titleLength <= 65 ? "pass" : "warn",
    !titleLength
      ? "The homepage has no <title>."
      : `${titleLength} characters${titleLength < 30 ? " (short; 30–65 is typical for search results)" : titleLength > 65 ? " (long; search results cut it off after about 65)" : ""}.`,
  );

  const metaLength = home.metaDescription.length;
  add(
    "meta",
    "Meta description",
    !metaLength ? "fail" : metaLength >= 70 && metaLength <= 160 ? "pass" : "warn",
    !metaLength
      ? "No meta description, so search engines choose their own snippet."
      : `${metaLength} characters${metaLength < 70 ? " (short; 70–160 is typical)" : metaLength > 160 ? " (long; search results cut it off after about 160)" : ""}.`,
  );

  const h1s = home.headings.filter((h) => h.level === 1).length;
  add(
    "h1",
    "One main heading (H1)",
    h1s === 1 ? "pass" : h1s === 0 ? "fail" : "warn",
    h1s === 1 ? "The homepage has exactly one H1." : h1s === 0 ? "The homepage has no H1." : `The homepage has ${h1s} different H1s.`,
  );

  add(
    "cta",
    "Calls to action on the homepage",
    home.ctas.length >= 2 ? "pass" : home.ctas.length === 1 ? "warn" : "fail",
    home.ctas.length ? `Found: ${home.ctas.slice(0, 5).join(", ")}${home.ctas.length > 5 ? "…" : ""}` : "No clear call to action found.",
  );

  add(
    "content-depth",
    "Homepage content depth",
    home.wordCount >= 300 ? "pass" : home.wordCount >= 120 ? "warn" : "fail",
    `${home.wordCount} words of readable text${home.wordCount < 120 ? " (the site may build its content with JavaScript, which this reader can't run)" : ""}.`,
  );

  add(
    "pricing",
    "Pricing page",
    kinds.has("pricing") ? "pass" : "warn",
    kinds.has("pricing") ? "A pricing page is linked from the homepage." : "No pricing page linked from the homepage.",
  );

  add(
    "blog",
    "Blog or resources",
    kinds.has("blog") ? "pass" : "warn",
    kinds.has("blog") ? "A blog or resources section is linked." : "No blog or resources section linked from the homepage.",
  );

  add(
    "about",
    "About page",
    kinds.has("about") ? "pass" : "warn",
    kinds.has("about") ? "An about page is linked." : "No about page linked from the homepage.",
  );

  const socials = site.socialLinks.length;
  add(
    "social",
    "Social profiles linked",
    socials >= 2 ? "pass" : socials === 1 ? "warn" : "fail",
    socials ? site.socialLinks.map((s) => s.platform).join(", ") : "No social profiles linked from the website.",
  );

  return checks;
}

/** The checks as plain text for the AI prompt. */
export function formatChecksForPrompt(checks: SiteCheck[]): string {
  return checks.map((c) => `- [${c.status.toUpperCase()}] ${c.label}: ${c.detail}`).join("\n");
}
