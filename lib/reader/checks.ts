import type { Lang } from "@/lib/i18n";
import { CHECK_TEXT } from "./check-text";
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

export function runSiteChecks(site: WebsiteData, lang: Lang = "en"): SiteCheck[] {
  const T = CHECK_TEXT[lang];
  const home = site.pages[0];
  const kinds = new Set(site.pages.map((p) => p.kind));
  const checks: SiteCheck[] = [];
  const add = (id: string, label: string, status: CheckStatus, detail: string) =>
    checks.push({ id, label, status, detail });

  const https = site.finalUrl.startsWith("https://");
  add("https", T.https.label, https ? "pass" : "fail", https ? T.https.pass : T.https.fail);

  const titleLength = home.title.length;
  add(
    "title",
    T.title.label,
    !titleLength ? "fail" : titleLength >= 30 && titleLength <= 65 ? "pass" : "warn",
    !titleLength ? T.title.missing : `${T.title.chars(titleLength)}${titleLength < 30 ? T.title.short : titleLength > 65 ? T.title.long : ""}.`,
  );

  const metaLength = home.metaDescription.length;
  add(
    "meta",
    T.meta.label,
    !metaLength ? "fail" : metaLength >= 70 && metaLength <= 160 ? "pass" : "warn",
    !metaLength ? T.meta.missing : `${T.meta.chars(metaLength)}${metaLength < 70 ? T.meta.short : metaLength > 160 ? T.meta.long : ""}.`,
  );

  const h1s = home.headings.filter((h) => h.level === 1).length;
  add("h1", T.h1.label, h1s === 1 ? "pass" : h1s === 0 ? "fail" : "warn", h1s === 1 ? T.h1.one : h1s === 0 ? T.h1.none : T.h1.many(h1s));

  add(
    "cta",
    T.cta.label,
    home.ctas.length >= 2 ? "pass" : home.ctas.length === 1 ? "warn" : "fail",
    home.ctas.length ? T.cta.found(`${home.ctas.slice(0, 5).join(", ")}${home.ctas.length > 5 ? "…" : ""}`) : T.cta.none,
  );

  add(
    "content-depth",
    T.depth.label,
    home.wordCount >= 300 ? "pass" : home.wordCount >= 120 ? "warn" : "fail",
    `${T.depth.words(home.wordCount)}${home.wordCount < 120 ? T.depth.js : ""}.`,
  );

  add("pricing", T.pricing.label, kinds.has("pricing") ? "pass" : "warn", kinds.has("pricing") ? T.pricing.pass : T.pricing.fail);
  add("blog", T.blog.label, kinds.has("blog") ? "pass" : "warn", kinds.has("blog") ? T.blog.pass : T.blog.fail);
  add("about", T.about.label, kinds.has("about") ? "pass" : "warn", kinds.has("about") ? T.about.pass : T.about.fail);

  const socials = site.socialLinks.length;
  add(
    "social",
    T.social.label,
    socials >= 2 ? "pass" : socials === 1 ? "warn" : "fail",
    socials ? site.socialLinks.map((s) => s.platform).join(", ") : T.social.none,
  );

  return checks;
}

/** The checks as plain text for the AI prompt. */
export function formatChecksForPrompt(checks: SiteCheck[]): string {
  return checks.map((c) => `- [${c.status.toUpperCase()}] ${c.label}: ${c.detail}`).join("\n");
}
