import { getBenchmark } from "@/lib/store/reports";

export const runtime = "nodejs";

/**
 * GET /api/benchmark?score=53 → { total, averageScore, betterThan } across all audited websites,
 * or null while there are fewer than 10. Cached briefly at the edge; the numbers change slowly.
 */
export async function GET(request: Request) {
  const score = Number(new URL(request.url).searchParams.get("score"));
  if (!Number.isFinite(score) || score < 0 || score > 100) return Response.json(null, { status: 400 });
  const benchmark = await getBenchmark(score).catch(() => null);
  return Response.json(benchmark, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } });
}
