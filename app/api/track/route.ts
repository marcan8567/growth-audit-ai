import { sendLeadAlert } from "@/lib/notify";
import { CLIENT_EVENTS, track, type StatEvent } from "@/lib/store/stats";
import { loadReport } from "@/lib/store/reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OFFERS: Partial<Record<StatEvent, string>> = {
  cta_quickwins: "full quick-wins list",
  cta_contentplan: "full content plan",
};

/**
 * POST { event, reportId? } from the browser (sent with navigator.sendBeacon, so it survives
 * the page opening LinkedIn in a new tab). Only a few button events are accepted here.
 */
export async function POST(request: Request) {
  let body: { event?: unknown; reportId?: unknown };
  try {
    body = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }

  const event = body.event as StatEvent;
  if (!CLIENT_EVENTS.includes(event)) return new Response(null, { status: 400 });
  await track(event);

  const offer = OFFERS[event];
  if (offer) {
    // The website name comes from the saved report, not from the browser, so it can't be faked.
    const reportId = typeof body.reportId === "string" ? body.reportId : null;
    const report = reportId ? await loadReport(reportId).catch(() => null) : null;
    const origin = new URL(request.url).origin;
    await sendLeadAlert({
      domain: report?.site?.domain ?? null,
      offer,
      reportUrl: report ? `${origin}/r/${report.id}` : null,
    });
  }

  return new Response(null, { status: 204 });
}
