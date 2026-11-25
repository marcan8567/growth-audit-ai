/**
 * Reports a button click to /api/track. Uses sendBeacon, which still delivers when the click
 * opens a new tab or leaves the page. Never throws: tracking must not break a button.
 */
export function trackClick(event: "link_copy" | "cta_quickwins" | "cta_contentplan" | "cta_contact" | "share_linkedin" | "share_x", reportId?: string | null) {
  try {
    const body = JSON.stringify({ event, reportId: reportId ?? undefined });
    if (!navigator.sendBeacon?.("/api/track", body)) {
      void fetch("/api/track", { method: "POST", body, keepalive: true });
    }
  } catch {
    // ignore
  }
}
