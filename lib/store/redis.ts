import "server-only";
import { Redis } from "@upstash/redis";

let client: Redis | null | undefined;

/**
 * The Upstash Redis client, or null when it isn't configured (for example in local
 * development without the keys). Everything that uses Redis must work without it.
 *
 * Accepts Upstash's own variable names and the ones Vercel's Upstash integration creates.
 */
export function getRedis(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  client = url && token ? new Redis({ url, token }) : null;
  return client;
}
