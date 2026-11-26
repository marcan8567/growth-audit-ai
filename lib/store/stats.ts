import "server-only";
import { getRedis } from "./redis";

/**
 * Funnel counters: one number per event per day, stored in Redis.
 * No cookies, no IP addresses, nothing about who did it, just how often.
 * The owner's own audits are counted separately so they don't distort the funnel.
 */

export const STAT_EVENTS = [
  "home_view", // homepage loaded
  "audit_started", // a visitor's audit passed the limits and started
  "audit_completed", // a visitor's audit finished and was saved
  "owner_audit", // an audit run with the access code (kept out of the funnel)
  "report_view", // a saved report page was opened
  "link_copy", // a report link was copied
  "cta_quickwins", // "Message me on LinkedIn" under the hidden quick wins
  "cta_contentplan", // "Message me on LinkedIn" under the posts
  "cta_contact", // "Message me on LinkedIn" on the homepage or in the report's contact box
  "share_linkedin", // a report shared with the LinkedIn button
  "share_x", // a report shared with the X button
  "lead_email", // an email left in the form under a report
] as const;

export type StatEvent = (typeof STAT_EVENTS)[number];

/** Events the browser may report (the rest are counted on the server). */
export const CLIENT_EVENTS: readonly StatEvent[] = ["link_copy", "cta_quickwins", "cta_contentplan", "cta_contact", "share_linkedin", "share_x"];

// Separate counters for local, preview and production, so testing never shows up in the live numbers.
const ENVIRONMENT = process.env.VERCEL_ENV ?? "local";
const KEEP_DAYS = 400;

const dayKey = (date: Date) => `stats:${ENVIRONMENT}:${date.toISOString().slice(0, 10)}`;

/** Adds one to today's count. Never throws: tracking must not break the page it's on. */
export async function track(event: StatEvent): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    const key = dayKey(new Date());
    await redis.hincrby(key, event, 1);
    await redis.expire(key, KEEP_DAYS * 24 * 60 * 60);
  } catch (err) {
    console.error("[stats] tracking failed:", err);
  }
}

export interface DailyStats {
  date: string;
  counts: Record<StatEvent, number>;
}

/** The last `days` days, oldest first, with zeros for days without activity. */
export async function readStats(days = 30): Promise<{ days: DailyStats[]; totals: Record<StatEvent, number> }> {
  const redis = getRedis();
  const empty = () => Object.fromEntries(STAT_EVENTS.map((e) => [e, 0])) as Record<StatEvent, number>;
  const dates = Array.from({ length: days }, (_, i) => new Date(Date.now() - (days - 1 - i) * 86_400_000));

  const rows = redis
    ? await Promise.all(dates.map((d) => redis.hgetall<Record<string, number | string>>(dayKey(d))))
    : dates.map(() => null);

  const totals = empty();
  const result = dates.map((d, i) => {
    const counts = empty();
    for (const e of STAT_EVENTS) {
      const n = Number(rows[i]?.[e] ?? 0) || 0;
      counts[e] = n;
      totals[e] += n;
    }
    return { date: d.toISOString().slice(0, 10), counts };
  });
  return { days: result, totals };
}
