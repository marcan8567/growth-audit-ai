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

// Reports are kept for 6 months, then Redis deletes them automatically.
const KEEP_FOR_SECONDS = 60 * 60 * 24 * 183;

// Report links are random and unguessable, so a report is only seen by people you send the link to.
const ID_PATTERN = /^[A-Za-z0-9_-]{10}$/;

/** Saves a report and returns its id, or null if Redis isn't configured. */
export async function saveReport(data: ReportData): Promise<string | null> {
  const redis = getRedis();
  if (!redis) return null;
  const id = randomBytes(8).toString("base64url").slice(0, 10);
  const report: SavedReport = { ...data, id, createdAt: new Date().toISOString() };
  await redis.set(`report:${id}`, report, { ex: KEEP_FOR_SECONDS });
  return id;
}

export async function loadReport(id: string): Promise<SavedReport | null> {
  const redis = getRedis();
  if (!redis || !ID_PATTERN.test(id)) return null;
  return redis.get<SavedReport>(`report:${id}`);
}
