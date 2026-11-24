import { normalizeInputUrl } from "./url";

const USER_AGENT =
  "Mozilla/5.0 (compatible; GrowthAuditAI/0.1; portfolio project that reads public marketing pages)";
const MAX_HTML_CHARS = 1_500_000; // ignore anything past ~1.5 MB of HTML
const DEFAULT_TIMEOUT_MS = 8_000;

export interface FetchedHtml {
  html: string;
  finalUrl: string;
}

/**
 * Downloads one HTML page with a timeout, so a slow website can't eat the whole
 * server-function time budget on Vercel's free plan.
 */
export async function fetchHtml(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<FetchedHtml> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en,de;q=0.8,es;q=0.6",
      },
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`The page answered with HTTP ${res.status}.`);

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("html")) {
      throw new Error(`Not an HTML page (${contentType || "unknown type"}).`);
    }

    // A redirect could lead to a private address; re-check where we ended up.
    const finalUrl = res.url || url;
    normalizeInputUrl(finalUrl);

    const html = (await res.text()).slice(0, MAX_HTML_CHARS);
    return { html, finalUrl };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`The page took longer than ${timeoutMs / 1000} seconds to load.`);
    }
    // Node's fetch reports DNS failures, refused connections and TLS errors as a bare "fetch failed".
    if (err instanceof TypeError && err.message === "fetch failed") {
      throw new Error("The website couldn't be reached. Check the address is spelled correctly.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
