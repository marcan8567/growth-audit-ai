import * as cheerio from "cheerio";
import type { Heading, PageData, PageKind, SocialLink } from "./types";
import { siteKey } from "./url";

const MAX_TEXT_CHARS = 6_000; // per page — enough for tone and messaging, cheap on tokens
const MAX_HEADINGS = 25;
const MAX_CTAS = 12;

const SOCIAL_PLATFORMS: { platform: string; host: RegExp }[] = [
  { platform: "LinkedIn", host: /(^|\.)linkedin\.com$/ },
  { platform: "Instagram", host: /(^|\.)instagram\.com$/ },
  { platform: "X", host: /(^|\.)(x|twitter)\.com$/ },
  { platform: "Facebook", host: /(^|\.)facebook\.com$/ },
  { platform: "YouTube", host: /(^|\.)(youtube\.com|youtu\.be)$/ },
  { platform: "TikTok", host: /(^|\.)tiktok\.com$/ },
  { platform: "Pinterest", host: /(^|\.)pinterest\.[a-z.]+$/ },
  { platform: "Threads", host: /(^|\.)threads\.(net|com)$/ },
];

// Words that usually mark a call to action on a marketing site.
const CTA_WORDS =
  /\b(get started|start|sign ?up|join|book|demo|contact|talk to|try|free trial|buy|shop|order|subscribe|download|request|schedule|apply|get a quote|learn more|see pricing)\b/i;

export interface LinkInfo {
  url: string;
  text: string;
}

export interface ExtractedPage {
  page: PageData;
  internalLinks: LinkInfo[];
  socialLinks: SocialLink[];
}

const clean = (value: string | undefined | null) => (value ?? "").replace(/\s+/g, " ").trim();

/**
 * Turns raw HTML into the facts a marketer cares about: title, meta description,
 * headings, calls to action, social links, internal links and the readable text.
 */
export function extractPage(html: string, pageUrl: string, kind: PageKind): ExtractedPage {
  const $ = cheerio.load(html);
  const base = new URL(pageUrl);

  const title = clean($("title").first().text()) || clean($('meta[property="og:title"]').attr("content"));
  const metaDescription =
    clean($('meta[name="description"]').attr("content")) ||
    clean($('meta[property="og:description"]').attr("content"));

  // Links: split into internal pages (to pick key pages) and social profiles.
  const internalLinks: LinkInfo[] = [];
  const socialLinks: SocialLink[] = [];
  const seenLinks = new Set<string>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return;

    let url: URL;
    try {
      url = new URL(href, base);
    } catch {
      return;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") return;
    url.hash = "";

    const host = url.hostname.toLowerCase();
    const social = SOCIAL_PLATFORMS.find((p) => p.host.test(host));
    if (social) {
      if (!socialLinks.some((s) => s.platform === social.platform)) {
        socialLinks.push({ platform: social.platform, url: url.href });
      }
      return;
    }

    if (siteKey(host) === siteKey(base.hostname) && !seenLinks.has(url.href)) {
      seenLinks.add(url.href);
      internalLinks.push({ url: url.href, text: clean($(el).text()) || clean($(el).attr("aria-label")) });
    }
  });

  const headings: Heading[] = [];
  $("h1, h2, h3").each((_, el) => {
    if (headings.length >= MAX_HEADINGS) return;
    const text = clean($(el).text());
    const tag = String($(el).prop("tagName") ?? "").toLowerCase();
    const level = tag === "h1" ? 1 : tag === "h2" ? 2 : 3;
    if (text.length > 1 && !headings.some((h) => h.text === text)) headings.push({ level, text });
  });

  const ctas: string[] = [];
  $('a, button, input[type="submit"]').each((_, el) => {
    if (ctas.length >= MAX_CTAS) return;
    const node = $(el);
    const text = clean(node.is("input") ? node.attr("value") : node.text());
    const looksLikeButton = /btn|button|cta/i.test(node.attr("class") ?? "") || node.is("button");
    if (text.length < 2 || text.length > 40) return;
    if ((CTA_WORDS.test(text) || looksLikeButton) && !ctas.includes(text)) ctas.push(text);
  });

  // Readable text: drop code, menus and footers, then add spaces between blocks
  // so "Pricing" and "Plans" don't get glued into "PricingPlans".
  $("script, style, noscript, svg, iframe, template, nav, footer").remove();
  $("br").replaceWith(" ");
  $("p, div, li, section, article, h1, h2, h3, h4, h5, h6, td, th, span, a, button").append(" ");
  const root = $("main").length ? $("main") : $("body");
  const fullText = clean(root.text());
  const text = fullText.slice(0, MAX_TEXT_CHARS);

  return {
    page: {
      kind,
      url: pageUrl,
      title,
      metaDescription,
      headings,
      ctas,
      text,
      wordCount: fullText ? fullText.split(" ").length : 0,
    },
    internalLinks,
    socialLinks,
  };
}
