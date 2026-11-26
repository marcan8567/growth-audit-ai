import "server-only";
import { randomBytes } from "node:crypto";
import type { SiteCheck } from "@/lib/reader/checks";
import type { PageSpeedResult } from "@/lib/reader/pagespeed";
import type { WebsiteSummary } from "@/lib/reader/format";
import type { AutomationPlan } from "@/lib/schemas/automation-plan";
import type { ContentPack } from "@/lib/schemas/content-pack";
import type { BrandVoiceResult } from "@/lib/steps/brand-voice";
import type { GrowthAuditResult } from "@/lib/steps/growth-audit";
import type { KeywordsResult } from "@/lib/steps/keywords";
import { SITE } from "@/lib/site";
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
  keywords?: KeywordsResult;
}

export interface SavedReport extends ReportData {
  id: string;
  createdAt: string;
  /** True when the owner ran it with the access code: shown in full to everyone. */
  owner?: boolean;
}

// Visitors' reports are kept for 6 months, then Redis deletes them automatically.
const KEEP_FOR_SECONDS = 60 * 60 * 24 * 183;

// Report links are random and unguessable, so a visitor's report is only seen by people they send the link to.
const ID_PATTERN = /^[A-Za-z0-9_-]{10}$/;

/**
 * One finished audit for the homepage, without anything that identifies the website:
 * no domain, no link, just the result. Visitors' reports stay private to whoever has the link.
 */
export interface AnonymousAudit {
  score: number;
  grade: string;
  /** The lowest-scoring growth area, for example "Social presence". */
  weakest: string;
  createdAt: string;
}

export interface AuditOverview {
  total: number;
  averageScore: number | null;
  recent: AnonymousAudit[];
}

// Kept separately for local, preview and production, so local tests never show on the live homepage.
const ENVIRONMENT = process.env.VERCEL_ENV ?? "local";
const ANON_KEY = `anon:${ENVIRONMENT}`;
const TOTALS_KEY = `totals:${ENVIRONMENT}`;
const ANON_KEEP = 20;
// The owner's log of recent audits, with websites. Only readable through /stats with the admin code.
const LOG_KEY = `auditlog:${ENVIRONMENT}`;
const LOG_KEEP = 50;

/** One audit in the owner's log on /stats. */
export interface AuditLogEntry {
  id: string;
  domain: string;
  score: number | null;
  owner: boolean;
  createdAt: string;
}

/**
 * Saves a report and returns its id, or null if Redis isn't configured.
 *
 * Owner audits (run with the access code) are kept forever; visitors' reports expire after 6 months.
 * Every audit with a score also counts towards the homepage numbers, anonymously. The demo company
 * (Stryon Labs) is left out, so the numbers reflect real websites.
 */
export async function saveReport(data: ReportData, { owner = false } = {}): Promise<string | null> {
  const redis = getRedis();
  if (!redis) return null;
  const id = randomBytes(8).toString("base64url").slice(0, 10);
  const createdAt = new Date().toISOString();
  const report: SavedReport = { ...data, id, createdAt, owner };

  if (owner) await redis.set(`report:${id}`, report);
  else await redis.set(`report:${id}`, report, { ex: KEEP_FOR_SECONDS });

  if (data.site) {
    const entry: AuditLogEntry = { id, domain: data.site.domain, score: data.audit?.overallScore ?? null, owner, createdAt };
    await redis
      .lpush(LOG_KEY, entry)
      .then(() => redis.ltrim(LOG_KEY, 0, LOG_KEEP - 1))
      .catch((err) => console.error("[reports] audit log not updated:", err));
  }
  if (data.audit && data.site && data.site.domain !== SITE.demoSiteDomain) {
    await recordAnonymously(data.audit, createdAt).catch((err) => console.error("[reports] homepage numbers not updated:", err));
  }
  return id;
}

/** Adds one audit to the homepage counter and the anonymous recent list. */
async function recordAnonymously(audit: GrowthAuditResult, createdAt: string) {
  const redis = getRedis();
  if (!redis) return;
  const weakest = [...audit.categories].sort((x, y) => x.score - y.score)[0];
  const entry: AnonymousAudit = { score: audit.overallScore, grade: audit.grade, weakest: weakest?.label ?? "", createdAt };
  await redis.lpush(ANON_KEY, entry);
  await redis.ltrim(ANON_KEY, 0, ANON_KEEP - 1);
  await redis.hincrby(TOTALS_KEY, "audits", 1);
  await redis.hincrby(TOTALS_KEY, "scoreSum", audit.overallScore);
}

/** The newest audits with their websites, for the owner's /stats page only. */
export async function listAuditLog(limit = 50): Promise<AuditLogEntry[]> {
  const redis = getRedis();
  if (!redis) return [];
  return redis.lrange<AuditLogEntry>(LOG_KEY, 0, limit - 1);
}

/** The homepage numbers: how many websites were audited, their average score and the three newest results. */
export async function getAuditOverview(): Promise<AuditOverview> {
  const redis = getRedis();
  if (!redis) return { total: 0, averageScore: null, recent: [] };
  const [totals, recent] = await Promise.all([
    redis.hgetall<Record<string, number | string>>(TOTALS_KEY),
    redis.lrange<AnonymousAudit>(ANON_KEY, 0, 2),
  ]);
  const total = Number(totals?.audits ?? 0) || 0;
  const sum = Number(totals?.scoreSum ?? 0) || 0;
  return { total, averageScore: total ? Math.round(sum / total) : null, recent };
}

export async function loadReport(id: string): Promise<SavedReport | null> {
  const redis = getRedis();
  if (!redis || !ID_PATTERN.test(id)) return null;
  return redis.get<SavedReport>(`report:${id}`);
}
