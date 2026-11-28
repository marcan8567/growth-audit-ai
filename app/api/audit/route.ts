import type { ProgressEvent, StepId } from "@/lib/events";
import { parseLang } from "@/lib/i18n";
import { runSiteChecks } from "@/lib/reader/checks";
import { formatWebsiteForPrompt, summarizeWebsite } from "@/lib/reader/format";
import { readWebsite } from "@/lib/reader/read-website";
import { normalizeInputUrl } from "@/lib/reader/url";
import { fetchPageSpeed, isPageSpeedConfigured, type PageSpeedResult } from "@/lib/reader/pagespeed";
import { runAutomationPlan } from "@/lib/steps/automation-plan";
import { runKeywords } from "@/lib/steps/keywords";
import { MAX_COMPETITORS, runCompetitors } from "@/lib/steps/competitors";
import { runBrandVoice } from "@/lib/steps/brand-voice";
import { runContentPack } from "@/lib/steps/content-pack";
import { runGrowthAudit, type GrowthAuditResult } from "@/lib/steps/growth-audit";
import { redactAuditForVisitor } from "@/lib/report-access";
import { checkAccess } from "@/lib/store/rate-limit";
import { saveReport, type ReportData } from "@/lib/store/reports";
import { track } from "@/lib/store/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Seconds. A full audit usually takes 60–90s (the AI provider's speed varies); Vercel's free plan allows up to 300s with Fluid compute.
export const maxDuration = 180;

/**
 * POST { url, accessCode? } → a stream of progress events (NDJSON).
 *
 * Pipeline:
 *   0. Google PageSpeed (speed + mobile), started at once because it is slow
 *   1. Read the website + code checks (no AI)
 *   2. In parallel: brand voice, growth audit (waits for PageSpeed), automation plan
 *   3. Content pack, as soon as the brand voice is ready (it writes in that voice)
 *   4. Save the report (Upstash Redis) so it has a shareable link
 *
 * A failed AI step is reported and the others carry on, so one bad answer
 * doesn't throw away the rest of the report.
 */
export async function POST(request: Request) {
  let body: { url?: unknown; accessCode?: unknown; lang?: unknown; competitors?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send JSON with a url field." }, { status: 400 });
  }

  const url = typeof body.url === "string" ? body.url : "";
  // Check the address before the rate limit, so a typo doesn't use up one of the visitor's free audits.
  let mainHost: string;
  try {
    mainHost = normalizeInputUrl(url).hostname.replace(/^www./, "");
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Invalid website address." }, { status: 400 });
  }

  // Optional competitors: up to two other websites, checked the same way. Empty fields are ignored;
  // duplicates and the audited site itself are dropped.
  const competitors: string[] = [];
  for (const raw of Array.isArray(body.competitors) ? body.competitors : []) {
    if (typeof raw !== "string" || !raw.trim()) continue;
    let host: string;
    try {
      host = normalizeInputUrl(raw).hostname.replace(/^www./, "");
    } catch (err) {
      return Response.json({ error: `Competitor: ${err instanceof Error ? err.message : "invalid website address."}` }, { status: 400 });
    }
    if (host !== mainHost && !competitors.some((c) => normalizeInputUrl(c).hostname.replace(/^www./, "") === host)) competitors.push(raw.trim());
  }
  if (competitors.length > MAX_COMPETITORS) competitors.length = MAX_COMPETITORS;

  // Access code, or a free audit within the daily limits (see lib/store/rate-limit.ts).
  const access = await checkAccess(request, body.accessCode);
  if (!access.allowed) return Response.json({ error: access.error }, { status: access.status });
  // True when the access code was used: the owner sees everything and the audit is listed on the homepage.
  const owner = access.owner;
  // Funnel count; the owner's own audits are kept separate so they don't distort it.
  await track(owner ? "owner_audit" : "audit_started");

  // The report language (English, Spanish or German); anything else falls back to English.
  const lang = parseLang(body.lang);

  // Collected as the steps finish, then saved so the report gets its own link.
  const report: ReportData = { lang };

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // If the visitor closes the tab, the stream is gone: stop sending, and don't start new AI steps (they cost money).
      const disconnected = () => request.signal.aborted;
      const send = (event: ProgressEvent) => {
        if (disconnected()) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          // The stream was closed in the meantime; nothing to do.
        }
      };

      /** Runs one step, reports running/done/error, and returns its result (or null if it failed or was skipped). */
      async function step<T>(id: StepId, run: () => Promise<T>): Promise<T | null> {
        if (disconnected()) return null;
        send({ type: "step", step: id, status: "running" });
        const started = Date.now();
        try {
          const data = await run();
          if (id !== "read") Object.assign(report, { [id]: data });
          // Visitors see the first quick win only; the full audit is still saved (lib/report-access.ts).
          const shown = id === "audit" && !owner ? redactAuditForVisitor(data as GrowthAuditResult) : data;
          send({ type: "step", step: id, status: "done", data: shown, ms: Date.now() - started });
          return data;
        } catch (err) {
          console.error(`[audit] ${id} step failed:`, err);
          send({ type: "step", step: id, status: "error", message: err instanceof Error ? err.message : "Something went wrong." });
          return null;
        }
      }

      try {
        // 0. Google PageSpeed takes 10–30 seconds, so it starts straight away, alongside reading the website.
        const speed: Promise<PageSpeedResult | null> = isPageSpeedConfigured()
          ? step("speed", () => fetchPageSpeed(normalizeInputUrl(url).href, lang))
          : (send({ type: "step", step: "speed", status: "skipped", message: "Not configured (no Google PageSpeed API key)." }),
            Promise.resolve(null));

        // Competitors start straight away too; they only need their own websites.
        const rivals = competitors.length ? step("competitors", () => runCompetitors(competitors, lang)) : Promise.resolve(null);

        // 1. Read the website. Nothing else can run without it, so a failure here ends the audit.
        send({ type: "step", step: "read", status: "running" });
        const started = Date.now();
        let site;
        try {
          site = await readWebsite(url);
        } catch (err) {
          send({ type: "error", step: "read", message: err instanceof Error ? err.message : "Couldn't read the website." });
          return;
        }
        // How much shorter removing repeated passages makes the website text every AI step receives.
        console.info(`[website] ${site.domain}: ${formatWebsiteForPrompt(site, { dedupe: false }).length} chars, ${formatWebsiteForPrompt(site).length} after removing repeats`);
        const checks = runSiteChecks(site, lang);
        report.site = summarizeWebsite(site);
        report.checks = checks;
        send({ type: "step", step: "read", status: "done", data: { site: report.site, checks }, ms: Date.now() - started });

        // 2 + 3. The AI steps. The content pack waits only for the brand voice, not for the others.
        // The audit waits for Google's speed data, so its scores can use it (it runs without it if that failed).
        const brandVoice = step("brandVoice", () => runBrandVoice(site, lang));
        await Promise.all([
          speed.then((s) => step("audit", () => runGrowthAudit(site, [...checks, ...(s?.checks ?? [])], lang))),
          step("automation", () => runAutomationPlan(site, checks, lang)),
          step("keywords", () => runKeywords(site, lang)),
          rivals,
          brandVoice.then(async (voice) => {
            if (voice) await step("contentPack", () => runContentPack(site, voice, lang));
            else send({ type: "step", step: "contentPack", status: "error", message: "Skipped, because the brand voice step failed." });
          }),
        ]);

        // 4. Save the report so it gets its own link. Skipped if the visitor left or the growth audit itself
        //    failed: a shared report without its score would look broken.
        if (!disconnected() && report.audit) {
          try {
            const id = await saveReport(report, { owner });
            if (id) send({ type: "saved", id });
            if (id && !owner) await track("audit_completed");
          } catch (err) {
            console.error("[audit] saving the report failed:", err); // the report is still on screen
          }
        }

        send({ type: "done" });
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed because the visitor left.
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
