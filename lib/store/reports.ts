import "server-only";
import { randomBytes } from "node:crypto";
import type { SiteCheck } from "@/lib/reader/checks";
import type { PageSpeedResult } from "@/lib/reader/pagespeed";
import type { WebsiteSummary } from "@/lib/reader/format";
import type { AutomationPlan } from "@/lib/schemas/automation-plan";
import type { ContentPack } from "@/lib/schemas/content-pack";
import type { BrandVoiceResult } from "@/lib/steps/brand-voice";
import type { GrowthAuditResult } from "@/lib/steps/growth-audit";
import { getRedis } from "./redis";

/** Everything a finished audit produced. Also used by the report page. */
export interface ReportData {
  site?: WebsiteSummary;
  checks?: SiteCheck[];
  speed?: PageSpeedResult;
  brandVoice?: BrandVoiceResult;
  audit?: GrowthAuditResult;
  automation?: AutomationPlan;
  contentPack?: ContentPack;
}

export interface SavedReport extends ReportData {
  id: string;
  createdAt: string;
}

// Visitors' reports are kept for 6 months, then Redis deletes them automatically.
const KEEP_FOR_SECONDS = 60 * 60 * 24 * 183;

// Report links are random and unguessable, so a visitor's report is only seen by people they send the link to.
const ID_PATTERN = /^[A-Za-z0-9_-]{10}$/;

/** A short entry for the homepage's "Recent audits" boxes. */
export interface RecentAudit {
  id: string;
  domain: string;
  score: number;
  grade: string;
  createdAt: string;
}

// The recent-audits list, kept separately for local, preview and production,
// so local tests never appear on the live homepage.
const RECENT_KEY = `recent:${process.env.VERCEL_ENV ?? "local"}`;
const RECENT_KEEP = 20;

/**
 * Saves a report and returns its id, or null if Redis isn't configured.
 *
 * Owner audits (run with the access code) are kept forever and added to the homepage's
 * "Recent audits". Visitors' reports expire after 6 months and are never listed anywhere.
 */
export async function saveReport(data: ReportData, { owner = false } = {}): Promise<string | null> {
  const redis = getRedis();
  if (!redis) return null;
  const id = randomBytes(8).toString("base64url").slice(0, 10);
  const createdAt = new Date().toISOString();
  const report: SavedReport = { ...data, id, createdAt };

  if (owner) {
    await redis.set(`report:${id}`, report);
    if (data.audit && data.site) {
      const entry: RecentAudit = { id, domain: data.site.domain, score: data.audit.overallScore, grade: data.audit.grade, createdAt };
      await redis.lpush(RECENT_KEY, entry);
      await redis.ltrim(RECENT_KEY, 0, RECENT_KEEP - 1);
    }
  } else {
    await redis.set(`report:${id}`, report, { ex: KEEP_FOR_SECONDS });
  }
  return id;
}

/** The newest owner audits, one per website, leaving out any ids given (for example the homepage sample). */
export async function listRecentAudits(limit = 3, exclude: string[] = []): Promise<RecentAudit[]> {
  const redis = getRedis();
  if (!redis) return [];
  const entries = (await redis.lrange<RecentAudit>(RECENT_KEY, 0, RECENT_KEEP - 1)).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  ); // newest first, even if entries were added out of order
  const seen = new Set<string>();
  const result: RecentAudit[] = [];
  for (const entry of entries) {
    if (exclude.includes(entry.id) || seen.has(entry.domain)) continue;
    seen.add(entry.domain);
    result.push(entry);
    if (result.length === limit) break;
  }
  return result;
}

export async function loadReport(id: string): Promise<SavedReport | null> {
  const redis = getRedis();
  if (!redis || !ID_PATTERN.test(id)) return null;
  return redis.get<SavedReport>(`report:${id}`);
}
