import type { ProgressEvent, StepId } from "@/lib/events";
import { summarizeWebsite } from "@/lib/reader/format";
import { readWebsite } from "@/lib/reader/read-website";
import { runBrandVoice } from "@/lib/steps/brand-voice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // seconds; stays within Vercel's free-plan limits

/**
 * POST { url, accessCode } → a stream of progress events (NDJSON).
 * Streaming means the page shows each step as soon as it finishes,
 * instead of a spinner for the whole run.
 */
export async function POST(request: Request) {
  let body: { url?: unknown; accessCode?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send JSON with a url field." }, { status: 400 });
  }

  const url = typeof body.url === "string" ? body.url : "";
  const expectedCode = process.env.ACCESS_CODE;
  if (expectedCode && body.accessCode !== expectedCode) {
    return Response.json({ error: "Wrong or missing access code." }, { status: 401 });
  }
  if (!url.trim()) return Response.json({ error: "Please enter a website address." }, { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ProgressEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      let current: StepId | undefined;

      try {
        current = "read";
        send({ type: "step", step: "read", status: "running" });
        let t = Date.now();
        const site = await readWebsite(url);
        send({ type: "step", step: "read", status: "done", data: summarizeWebsite(site), ms: Date.now() - t });

        current = "brandVoice";
        send({ type: "step", step: "brandVoice", status: "running" });
        t = Date.now();
        const brandVoice = await runBrandVoice(site);
        send({ type: "step", step: "brandVoice", status: "done", data: brandVoice, ms: Date.now() - t });

        send({ type: "done" });
      } catch (err) {
        console.error(`[brand-voice-test] ${current ?? "unknown"} step failed:`, err);
        send({ type: "error", step: current, message: err instanceof Error ? err.message : "Something went wrong." });
      } finally {
        controller.close();
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
