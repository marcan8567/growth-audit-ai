import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { z } from "zod";
import { redactReportForVisitor } from "@/lib/report-access";
import { getRedis } from "@/lib/store/redis";
import { loadReport } from "@/lib/store/reports";
import { track } from "@/lib/store/stats";
import { runOutreach } from "@/lib/steps/outreach";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ENVIRONMENT = process.env.VERCEL_ENV ?? "local";
const PER_DAY = 20;
let limiter: Ratelimit | null | undefined;

const Field = (max: number) => z.string().trim().max(max).optional().transform((v) => v || undefined);
const Body = z.object({
  reportId: z.string().regex(/^[A-Za-z0-9_-]{10}$/),
  senderName: Field(80),
  senderCompany: Field(80),
  offer: Field(140),
  contactName: Field(60),
});

/**
 * POST { reportId, senderName?, senderCompany?, offer?, contactName? } → the outreach kit for that report.
 * Generated on request only (not with every audit) and not stored. Visitors' reports are redacted first,
 * so quick wins they can't see never appear in a message. 20 kits per visitor per day.
 */
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Please check the fields and try again." }, { status: 400 });
  const { reportId, ...input } = parsed.data;

  const redis = getRedis();
  if (redis) {
    limiter ??= new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(PER_DAY, "1 d"), prefix: `rl:${ENVIRONMENT}:outreach` });
    const ip = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const { success } = await limiter.limit(createHash("sha256").update(`growth-audit-ai:${ip}`).digest("hex").slice(0, 32));
    if (!success) return Response.json({ error: `That's ${PER_DAY} message sets for today. Try again tomorrow.` }, { status: 429 });
  }

  const saved = await loadReport(reportId).catch(() => null);
  if (!saved?.audit) return Response.json({ error: "Report not found." }, { status: 404 });
  const report = saved.owner ? saved : redactReportForVisitor(saved);
  const reportUrl = `${new URL(request.url).origin}/r/${reportId}`;

  try {
    const kit = await runOutreach(report, reportUrl, input, report.lang ?? "en");
    await track("outreach_created");
    return Response.json(kit, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[outreach] failed:", err);
    return Response.json({ error: "Couldn't write the messages right now. Please try again." }, { status: 502 });
  }
}
