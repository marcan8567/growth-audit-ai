import { listLeads } from "@/lib/store/leads";
import { readStats } from "@/lib/store/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST { code } → the last 30 days of funnel counts and the newest email leads. Only with the access code. */
export async function POST(request: Request) {
  const { code } = (await request.json().catch(() => ({}))) as { code?: unknown };
  const expected = process.env.ACCESS_CODE;
  if (!expected || code !== expected) return Response.json({ error: "Wrong access code." }, { status: 401 });
  const [stats, leads] = await Promise.all([readStats(30), listLeads(50)]);
  return Response.json({ ...stats, leads }, { headers: { "Cache-Control": "no-store" } });
}
