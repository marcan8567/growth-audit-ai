import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "./redis";

/**
 * Email leads: people who left their email under a report so the owner can get back to them.
 * This is the only personal data the site stores, so it is kept to the minimum (email, website, date),
 * deleted automatically after 12 months, and only readable with the access code (/stats).
 */

export interface Lead {
  id: string;
  email: string;
  domain: string | null;
  reportId: string | null;
  createdAt: string;
}

const ENVIRONMENT = process.env.VERCEL_ENV ?? "local";
const INDEX_KEY = `leads:${ENVIRONMENT}`; // sorted set of lead ids, newest = highest score
const leadKey = (id: string) => `lead:${ENVIRONMENT}:${id}`;
export const LEAD_KEEP_DAYS = 365;

/** Five emails per visitor per day is plenty for a person and stops a bot from filling the list. */
let limiter: Ratelimit | null | undefined;
export async function leadAllowed(request: Request): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  limiter ??= new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 d"), prefix: `rl:${ENVIRONMENT}:lead` });
  const ip = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success } = await limiter.limit(createHash("sha256").update(`growth-audit-ai:${ip}`).digest("hex").slice(0, 32));
  return success;
}

export async function saveLead(lead: Omit<Lead, "id" | "createdAt">): Promise<Lead | null> {
  const redis = getRedis();
  if (!redis) return null;
  const saved: Lead = { ...lead, id: randomBytes(8).toString("base64url").slice(0, 10), createdAt: new Date().toISOString() };
  await redis.set(leadKey(saved.id), saved, { ex: LEAD_KEEP_DAYS * 24 * 60 * 60 });
  await redis.zadd(INDEX_KEY, { score: Date.now(), member: saved.id });
  // Ids older than the keep period point to deleted leads; drop them from the index too.
  await redis.zremrangebyscore(INDEX_KEY, 0, Date.now() - LEAD_KEEP_DAYS * 24 * 60 * 60 * 1000);
  return saved;
}

/** The newest leads first. Only for the owner's /stats page. */
export async function listLeads(limit = 50): Promise<Lead[]> {
  const redis = getRedis();
  if (!redis) return [];
  const ids = await redis.zrange<string[]>(INDEX_KEY, 0, limit - 1, { rev: true });
  if (!ids.length) return [];
  const leads = await redis.mget<(Lead | null)[]>(...ids.map(leadKey));
  return leads.filter((l): l is Lead => Boolean(l));
}
