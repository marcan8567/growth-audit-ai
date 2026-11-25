import { z } from "zod";
import { sendLeadAlert } from "@/lib/notify";
import { leadAllowed, saveLead } from "@/lib/store/leads";
import { loadReport } from "@/lib/store/reports";
import { track } from "@/lib/store/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  reportId: z.string().max(20).nullish(),
  // A field people never see. Bots that fill in every field give themselves away.
  company: z.string().max(200).optional(),
});

/** POST { email, reportId? } from the form under a report. Stores the email so the owner can reply. */
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  const { email, reportId, company } = parsed.data;

  // Pretend it worked for bots, so they don't learn to skip the hidden field.
  if (company) return new Response(null, { status: 204 });

  if (!(await leadAllowed(request))) {
    return Response.json({ error: "That's enough emails for today. Message me on LinkedIn instead." }, { status: 429 });
  }

  // The website comes from the saved report, not from the browser, so it can't be faked.
  const report = reportId ? await loadReport(reportId).catch(() => null) : null;
  const lead = await saveLead({ email, domain: report?.site?.domain ?? null, reportId: report?.id ?? null });
  if (!lead) return Response.json({ error: "Couldn't save your email right now. Message me on LinkedIn instead." }, { status: 503 });

  await track("lead_email");
  // The alert names the website only; the email itself stays in the database (see the privacy policy).
  await sendLeadAlert({
    domain: lead.domain,
    offer: "left their email",
    reportUrl: lead.reportId ? `${new URL(request.url).origin}/r/${lead.reportId}` : null,
  });

  return new Response(null, { status: 204 });
}
