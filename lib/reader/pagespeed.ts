import type { Lang } from "@/lib/i18n";
import { CHECK_TEXT } from "./check-text";
import type { SiteCheck } from "./checks";

/**
 * Google PageSpeed Insights: real speed and mobile measurements from Google,
 * not AI opinion. Runs Lighthouse on Google's servers (mobile), and adds data
 * from real Chrome users when Google has enough of it for the site.
 *
 * Needs PAGESPEED_API_KEY: without a key, Google's shared quota is almost always used up.
 */

const ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const TIMEOUT_MS = 60_000; // Lighthouse runs a real browser; Google often takes 20–45s
const CATEGORIES = ["performance", "seo", "accessibility", "best-practices"] as const;

export interface PageSpeedResult {
  url: string;
  strategy: "mobile";
  /** Lighthouse scores, 0–100. */
  scores: { performance: number | null; seo: number | null; accessibility: number | null; bestPractices: number | null };
  /** Lab measurements from Lighthouse's test run. */
  lab: {
    largestContentfulPaintMs: number | null;
    cumulativeLayoutShift: number | null;
    totalBlockingTimeMs: number | null;
    firstContentfulPaintMs: number | null;
  };
  /** Real Chrome users over the last 28 days, if Google has enough data. */
  field: {
    overall: "FAST" | "AVERAGE" | "SLOW" | null;
    largestContentfulPaintMs: number | null;
    interactionToNextPaintMs: number | null;
    cumulativeLayoutShift: number | null;
    /** True when the data covers the whole website rather than this exact page. */
    wholeSite: boolean;
  } | null;
  checks: SiteCheck[];
}

export function isPageSpeedConfigured(): boolean {
  return Boolean(process.env.PAGESPEED_API_KEY);
}

export async function fetchPageSpeed(url: string, lang: Lang = "en"): Promise<PageSpeedResult> {
  const key = process.env.PAGESPEED_API_KEY;
  if (!key) throw new Error("Speed data isn't available (no PageSpeed API key configured).");

  const params = new URLSearchParams({ url, strategy: "mobile", key });
  for (const c of CATEGORIES) params.append("category", c);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let data: PsiResponse;
  try {
    const res = await fetch(`${ENDPOINT}?${params}`, { signal: controller.signal, cache: "no-store" });
    data = (await res.json()) as PsiResponse;
    if (!res.ok || data.error) {
      const reason = data.error?.message ?? `HTTP ${res.status}`;
      throw new Error(`Google PageSpeed couldn't test this site: ${reason.split(".")[0]}.`);
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Google PageSpeed took longer than ${TIMEOUT_MS / 1000} seconds.`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  const lh = data.lighthouseResult;
  const score = (id: string) => {
    const s = lh?.categories?.[id]?.score;
    return typeof s === "number" ? Math.round(s * 100) : null;
  };
  const audit = (id: string) => {
    const v = lh?.audits?.[id]?.numericValue;
    return typeof v === "number" ? v : null;
  };

  const metrics = data.loadingExperience?.metrics;
  const fieldValue = (id: string) => {
    const v = metrics?.[id]?.percentile;
    return typeof v === "number" ? v : null;
  };
  const fieldCls = fieldValue("CUMULATIVE_LAYOUT_SHIFT_SCORE");
  const field = metrics
    ? {
        overall: data.loadingExperience?.overall_category ?? null,
        largestContentfulPaintMs: fieldValue("LARGEST_CONTENTFUL_PAINT_MS"),
        interactionToNextPaintMs: fieldValue("INTERACTION_TO_NEXT_PAINT"),
        cumulativeLayoutShift: fieldCls === null ? null : fieldCls / 100, // Google reports CLS × 100 here
        wholeSite: Boolean(data.loadingExperience?.origin_fallback),
      }
    : null;

  const result: Omit<PageSpeedResult, "checks"> = {
    url: lh?.finalDisplayedUrl ?? url,
    strategy: "mobile",
    scores: {
      performance: score("performance"),
      seo: score("seo"),
      accessibility: score("accessibility"),
      bestPractices: score("best-practices"),
    },
    lab: {
      largestContentfulPaintMs: audit("largest-contentful-paint"),
      cumulativeLayoutShift: audit("cumulative-layout-shift"),
      totalBlockingTimeMs: audit("total-blocking-time"),
      firstContentfulPaintMs: audit("first-contentful-paint"),
    },
    field,
  };
  return { ...result, checks: speedChecks(result, lang) };
}

/**
 * Turns the measurements into pass/warn/fail checks, using Google's own thresholds
 * (Core Web Vitals: LCP ≤ 2.5s good, ≤ 4s needs work; CLS ≤ 0.1 good, ≤ 0.25 needs work).
 * Real-user data is preferred over the lab test when Google has it.
 */
function speedChecks(r: Omit<PageSpeedResult, "checks">, lang: Lang): SiteCheck[] {
  const T = CHECK_TEXT[lang].speed;
  const checks: SiteCheck[] = [];
  const source = r.field ? T.realUsers : T.mobileTest;

  const perf = r.scores.performance;
  if (perf !== null) {
    checks.push({
      id: "speed-score",
      label: T.perfLabel,
      status: perf >= 90 ? "pass" : perf >= 50 ? "warn" : "fail",
      detail: `${T.perfDetail(perf)}${perf < 50 ? T.perfSlow : ""}.`,
    });
  }

  const lcp = r.field?.largestContentfulPaintMs ?? r.lab.largestContentfulPaintMs;
  if (lcp !== null) {
    checks.push({
      id: "lcp",
      label: T.lcpLabel,
      status: lcp <= 2500 ? "pass" : lcp <= 4000 ? "warn" : "fail",
      detail: T.target(`${(lcp / 1000).toFixed(1)}s`, source, "≤ 2.5s"),
    });
  }

  const cls = r.field?.cumulativeLayoutShift ?? r.lab.cumulativeLayoutShift;
  if (cls !== null) {
    checks.push({
      id: "cls",
      label: T.clsLabel,
      status: cls <= 0.1 ? "pass" : cls <= 0.25 ? "warn" : "fail",
      detail: T.target(cls.toFixed(2), source, "≤ 0.1"),
    });
  }

  const inp = r.field?.interactionToNextPaintMs ?? null;
  if (inp !== null) {
    checks.push({
      id: "inp",
      label: T.inpLabel,
      status: inp <= 200 ? "pass" : inp <= 500 ? "warn" : "fail",
      detail: T.target(`${inp}ms`, T.realUsers, "≤ 200ms"),
    });
  }

  const seo = r.scores.seo;
  if (seo !== null) {
    checks.push({
      id: "lighthouse-seo",
      label: T.seoLabel,
      status: seo >= 90 ? "pass" : seo >= 70 ? "warn" : "fail",
      detail: `${seo}/100.`,
    });
  }

  return checks;
}

/** The parts of Google's response this file reads. */
interface PsiResponse {
  error?: { message?: string };
  lighthouseResult?: {
    finalDisplayedUrl?: string;
    categories?: Record<string, { score?: number | null }>;
    audits?: Record<string, { numericValue?: number }>;
  };
  loadingExperience?: {
    overall_category?: "FAST" | "AVERAGE" | "SLOW";
    origin_fallback?: boolean;
    metrics?: Record<string, { percentile?: number }>;
  };
}
