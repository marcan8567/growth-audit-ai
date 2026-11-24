import * as cheerio from "cheerio";

/** How the company presents itself, used to show the suggested post as if the company posted it. */
export interface Brand {
  name: string;
  /** The site's icon (apple-touch-icon or favicon), as an absolute URL. Shown in the browser, never stored. */
  iconUrl: string | null;
  /** The colour the site declares for itself (theme-color), as #rrggbb. */
  color: string | null;
}

/** Reads the company's name, icon and brand colour from the homepage HTML. No extra requests. */
export function extractBrand(html: string, pageUrl: string, domain: string): Brand {
  const $ = cheerio.load(html);
  const clean = (v: string | undefined) => (v ?? "").replace(/\s+/g, " ").trim();

  // Name: what the site calls itself, else the first part of the page title, else the domain.
  const titleStart = clean($("title").first().text()).split(/\s[|\-–—:·]\s/)[0];
  const candidates = [
    clean($('meta[property="og:site_name"]').attr("content")),
    clean($('meta[name="application-name"]').attr("content")),
    titleStart,
  ];
  const name = candidates.find((c) => c.length >= 2 && c.length <= 40) ?? nameFromDomain(domain);

  // Icon: prefer the largest apple-touch-icon (sharp at avatar size), then any icon.
  const icons = $('link[rel~="apple-touch-icon"], link[rel~="icon"], link[rel="shortcut icon"]')
    .toArray()
    .map((el) => {
      const node = $(el);
      const size = Number((node.attr("sizes") ?? "").split("x")[0]) || 0;
      const apple = (node.attr("rel") ?? "").includes("apple-touch-icon");
      return { href: node.attr("href"), score: (apple ? 1000 : 0) + size };
    })
    .filter((i) => i.href && !i.href.startsWith("data:"))
    .sort((a, b) => b.score - a.score);
  let iconUrl: string | null = null;
  try {
    if (icons[0]?.href) {
      const url = new URL(icons[0].href, pageUrl);
      if (url.protocol === "https:") iconUrl = url.href;
    }
  } catch {
    // An invalid icon address: fall back to the company's initial.
  }

  return { name, iconUrl, color: normalizeHex(clean($('meta[name="theme-color"]').first().attr("content"))) };
}

/** "acme-labs.co.uk" → "Acme Labs" */
export function nameFromDomain(domain: string): string {
  const first = domain.replace(/^www\./, "").split(".")[0] ?? domain;
  return first
    .split(/[-_]/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function normalizeHex(value: string): string | null {
  const m = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  const hex = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  return `#${hex.toLowerCase()}`;
}
