import { extractBrand } from "./brand";
import { extractPage, type LinkInfo } from "./extract";
import { loadRobots } from "./robots";
import { fetchHtml } from "./fetch-page";
import type { PageData, PageKind, SocialLink, WebsiteData } from "./types";
import { normalizeInputUrl, siteKey } from "./url";

// How we recognise each key page, by URL path or by link text (several languages for EU sites).
const KEY_PAGES: { kind: Exclude<PageKind, "home">; path: RegExp; text: RegExp }[] = [
  {
    kind: "about",
    path: /\/(about|about-us|company|who-we-are|our-story|team|ueber-uns|uber-uns|sobre-nosotros|nosotros)(\/|$)/i,
    text: /^(about|about us|our story|company|who we are|über uns|sobre nosotros)$/i,
  },
  {
    kind: "pricing",
    path: /\/(pricing|plans|prices|preise|precios|tarifas)(\/|$)/i,
    text: /^(pricing|plans|prices|preise|precios)$/i,
  },
  {
    kind: "product",
    path: /\/(product|products|features|solutions|services|platform|produkt|produkte|leistungen|servicios|productos)(\/|$)/i,
    text: /^(product|products|features|solutions|services|platform|leistungen|servicios)$/i,
  },
  {
    kind: "blog",
    path: /\/(blog|news|insights|resources|articles|magazin|magazine|noticias)(\/|$)/i,
    text: /^(blog|news|insights|resources|articles|magazin)$/i,
  },
];

const SKIP_FILES = /\.(pdf|jpe?g|png|gif|webp|svg|zip|xml|mp4|mp3|docx?|xlsx?)$/i;

/** Picks at most one link per key-page type, preferring the shortest (most general) path. */
export function pickKeyPages(links: LinkInfo[], homeUrl: string): { kind: PageKind; url: string }[] {
  const home = new URL(homeUrl);
  const chosen: { kind: PageKind; url: string }[] = [];

  for (const rule of KEY_PAGES) {
    const candidates = links
      .map((link) => ({ link, url: new URL(link.url) }))
      .filter(({ url }) => url.pathname !== "/" && url.pathname !== home.pathname && !SKIP_FILES.test(url.pathname))
      .filter(({ link, url }) => rule.path.test(url.pathname) || rule.text.test(link.text))
      .filter(({ url }) => !chosen.some((c) => c.url === url.href))
      .sort((a, b) => a.url.pathname.length - b.url.pathname.length);

    if (candidates[0]) chosen.push({ kind: rule.kind, url: candidates[0].url.href });
  }
  return chosen;
}

/**
 * The website reader: homepage first, then up to 4 key pages in parallel.
 * A failed sub-page is recorded, not fatal — only a failed homepage stops the audit.
 */
export async function readWebsite(input: string): Promise<WebsiteData> {
  const start = normalizeInputUrl(input);

  // Respect the site's robots.txt: don't read a site (or page) that asks automated tools not to.
  const robots = await loadRobots(start.origin);
  if (!robots.isAllowed(start.pathname || "/")) {
    throw new Error(`${start.hostname} asks automated tools not to read it (robots.txt), so it can't be audited.`);
  }

  let homeHtml: string;
  let finalUrl: string;
  try {
    ({ html: homeHtml, finalUrl } = await fetchHtml(start.href));
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Unknown error";
    throw new Error(`Couldn't read ${start.hostname}: ${reason}`);
  }

  const home = extractPage(homeHtml, finalUrl, "home");
  // Key pages the site's robots.txt excludes are skipped and listed as not read.
  const skipped: WebsiteData["failedPages"] = [];
  const keyPages = pickKeyPages(home.internalLinks, finalUrl).filter(({ kind, url }) => {
    const allowed = robots.isAllowed(new URL(url).pathname);
    if (!allowed) skipped.push({ kind, url, error: "Skipped: the site's robots.txt asks automated tools not to read it." });
    return allowed;
  });

  const results = await Promise.allSettled(
    keyPages.map(async ({ kind, url }) => {
      const { html, finalUrl: pageUrl } = await fetchHtml(url, 6_000);
      return extractPage(html, pageUrl, kind);
    }),
  );

  const pages: PageData[] = [home.page];
  const socialLinks: SocialLink[] = [...home.socialLinks];
  const failedPages: WebsiteData["failedPages"] = [...skipped];

  results.forEach((result, i) => {
    const { kind, url } = keyPages[i];
    if (result.status === "fulfilled") {
      pages.push(result.value.page);
      for (const s of result.value.socialLinks) {
        if (!socialLinks.some((x) => x.platform === s.platform)) socialLinks.push(s);
      }
    } else {
      const error = result.reason instanceof Error ? result.reason.message : "Unknown error";
      failedPages.push({ kind, url, error });
    }
  });

  const domain = siteKey(new URL(finalUrl).hostname);
  return {
    inputUrl: input,
    finalUrl,
    domain,
    brand: extractBrand(homeHtml, finalUrl, domain),
    fetchedAt: new Date().toISOString(),
    pages,
    socialLinks,
    failedPages,
  };
}
