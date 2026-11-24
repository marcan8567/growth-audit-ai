import "server-only";
import { getRedis } from "./store/redis";

/**
 * Lead alerts: when someone clicks a "Message me on LinkedIn" button, a short message goes to
 * a Slack or Discord channel (an "incoming webhook" URL in LEAD_ALERT_WEBHOOK_URL).
 * Without that setting, nothing is sent.
 */

const MAX_ALERTS_PER_DAY = 30; // so a stuck button or a bot can't flood the channel
const ENVIRONMENT = process.env.VERCEL_ENV ?? "local";

export async function sendLeadAlert({ domain, offer, reportUrl }: { domain: string | null; offer: string; reportUrl: string | null }) {
  const webhook = process.env.LEAD_ALERT_WEBHOOK_URL;
  if (!webhook || !webhook.startsWith("https://")) return;

  const redis = getRedis();
  if (redis) {
    const key = `alerts:${ENVIRONMENT}:${new Date().toISOString().slice(0, 10)}`;
    const sent = await redis.incr(key);
    await redis.expire(key, 2 * 24 * 60 * 60);
    if (sent > MAX_ALERTS_PER_DAY) return;
  }

  const text = [
    `New lead: someone clicked "Message me on LinkedIn" (${offer})`,
    domain ? `Website audited: ${domain}` : null,
    reportUrl ? `Report: ${reportUrl}` : null,
    ENVIRONMENT !== "production" ? `(from ${ENVIRONMENT}, not the live site)` : null,
  ]
    .filter(Boolean)
    .join("\n");

  // Slack expects { text }, Discord expects { content }.
  const isDiscord = /discord(app)?\.com\/api\/webhooks\//.test(webhook);
  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isDiscord ? { content: text } : { text }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) console.error(`[lead alert] webhook answered HTTP ${res.status}`);
  } catch (err) {
    console.error("[lead alert] sending failed:", err);
  }
}
