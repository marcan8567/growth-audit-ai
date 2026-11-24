import { normalizeInputUrl } from "@/lib/reader/url";
import { loadReport } from "@/lib/store/reports";

export const runtime = "nodejs";

const MAX_BYTES = 300_000;

/**
 * GET /api/logo/<reportId>: the audited company's logo, fetched by our server.
 *
 * Privacy: visitors' browsers never contact the company's website, so their IP address isn't
 * sent to a third party (the issue German courts ruled on with Google Fonts).
 * Security: only the logo address saved with that report is fetched, never a URL from the
 * request, so this can't be used to make the server call arbitrary addresses.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const report = await loadReport((await params).id).catch(() => null);
  const iconUrl = report?.site?.brand?.iconUrl;
  if (!iconUrl) return new Response(null, { status: 404 });

  try {
    const url = normalizeInputUrl(iconUrl); // https only, no private or local addresses
    const res = await fetch(url, { signal: AbortSignal.timeout(4_000), headers: { Accept: "image/*" } });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) return new Response(null, { status: 404 });
    const body = await res.arrayBuffer();
    if (body.byteLength > MAX_BYTES) return new Response(null, { status: 404 });
    return new Response(body, {
      headers: {
        "Content-Type": type,
        // Logos rarely change: browsers keep it a day, Vercel's cache a week.
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox", // in case an SVG logo contains scripts
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
