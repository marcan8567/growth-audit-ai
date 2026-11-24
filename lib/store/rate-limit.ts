import "server-only";
import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "./redis";

/**
 * Who may run an audit, and how often.
 *
 * - Visitors with the access code: no limits (for you and your demos).
 * - Everyone else: a few audits per visitor per day, and a daily cap for the whole site,
 *   so the AI bill stays small even if the link is shared widely.
 * - Without Redis there's no way to count, so only the access code works (the old behaviour).
 */

const PER_VISITOR_PER_DAY = numberFromEnv("PUBLIC_AUDITS_PER_VISITOR_PER_DAY", 3);
const SITE_WIDE_PER_DAY = numberFromEnv("PUBLIC_AUDITS_PER_DAY", 25);

// Separate counters for local, preview and production, so testing never uses up the live site's limits.
const ENVIRONMENT = process.env.VERCEL_ENV ?? "local";

let limiters: { visitor: Ratelimit; site: Ratelimit } | null | undefined;

function getLimiters() {
  if (limiters !== undefined) return limiters;
  const redis = getRedis();
  limiters = redis
    ? {
        visitor: new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(PER_VISITOR_PER_DAY, "1 d"),
          prefix: `rl:${ENVIRONMENT}:visitor`,
        }),
        site: new Ratelimit({
          redis,
          limiter: Ratelimit.fixedWindow(SITE_WIDE_PER_DAY, "1 d"),
          prefix: `rl:${ENVIRONMENT}:site`,
        }),
      }
    : null;
  return limiters;
}

export type AccessDecision = { allowed: true; remaining?: number } | { allowed: false; status: number; error: string };

export async function checkAccess(request: Request, accessCode: unknown): Promise<AccessDecision> {
  const expectedCode = process.env.ACCESS_CODE;
  if (!expectedCode || accessCode === expectedCode) return { allowed: true };

  const limit = getLimiters();
  if (!limit) return { allowed: false, status: 401, error: "Wrong or missing access code." };

  const visitor = await limit.visitor.limit(visitorId(request));
  if (!visitor.success) {
    return {
      allowed: false,
      status: 429,
      error: `You've used your ${PER_VISITOR_PER_DAY} free audits for today. Try again in ${hoursUntil(visitor.reset)}.`,
    };
  }

  const site = await limit.site.limit("all");
  if (!site.success) {
    return {
      allowed: false,
      status: 429,
      error: `The demo has reached today's limit of ${SITE_WIDE_PER_DAY} free audits. Try again in ${hoursUntil(site.reset)}.`,
    };
  }

  return { allowed: true, remaining: visitor.remaining };
}

/**
 * Visitors are counted by IP address, but the address is hashed first,
 * so no IP addresses are ever stored.
 */
function visitorId(request: Request): string {
  const ip =
    request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return createHash("sha256").update(`growth-audit-ai:${ip}`).digest("hex").slice(0, 32);
}

function hoursUntil(resetMs: number): string {
  const hours = Math.max(1, Math.ceil((resetMs - Date.now()) / 3_600_000));
  return hours === 1 ? "about an hour" : `about ${hours} hours`;
}

function numberFromEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
