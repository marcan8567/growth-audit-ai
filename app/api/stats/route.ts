import { createHash, timingSafeEqual } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { listLeads } from "@/lib/store/leads";
import { getRedis } from "@/lib/store/redis";
import { listAuditLog } from "@/lib/store/reports";
import { readStats } from "@/lib/store/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENVIRONMENT = process.env.VERCEL_ENV ?? "local";
let attempts: Ratelimit | null | undefined;

/**
 * POST { code } → the last 30 days of funnel counts, the newest audits with their websites, and the email leads.
 *
 * Owner only. It needs STATS_CODE, a separate admin code, so the demo access code (which unlocks unlimited
 * audits and can be shared) never opens this. Until STATS_CODE is set, ACCESS_CODE still works.
 * Guessing is slowed down to 10 tries per hour per visitor.
 */
export async function POST(request: Request) {
  // Only wrong codes count towards the limit, so refreshing the dashboard never locks you out.
  const redis = getRedis();
  const ip = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const visitor = createHash("sha256").update(`growth-audit-ai:${ip}`).digest("hex").slice(0, 32);
  if (redis) {
    attempts ??= new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 h"), prefix: `rl:${ENVIRONMENT}:stats` });
    const { remaining } = await attempts.getRemaining(visitor);
    if (remaining <= 0) return Response.json({ error: "Too many wrong tries. Wait an hour and try again." }, { status: 429 });
  }

  const { code } = (await request.json().catch(() => ({}))) as { code?: unknown };
  const expected = process.env.STATS_CODE || process.env.ACCESS_CODE;
  if (!expected || typeof code !== "string" || !sameText(code, expected)) {
    await attempts?.limit(visitor);
    return Response.json({ error: "Wrong code." }, { status: 401 });
  }

  const [stats, leads, audits] = await Promise.all([readStats(30), listLeads(50), listAuditLog(50)]);
  return Response.json({ ...stats, leads, audits }, { headers: { "Cache-Control": "no-store" } });
}

/** Compares in constant time, so the answer time doesn't hint at how much of the code was right. */
function sameText(a: string, b: string): boolean {
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
}
