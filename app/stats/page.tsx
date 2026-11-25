"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";

/**
 * Private funnel dashboard. Asks for the access code, then shows the last 30 days.
 * Counts only: no cookies, no IP addresses, nothing about who did what.
 */

type Counts = Record<
  | "home_view"
  | "audit_started"
  | "audit_completed"
  | "owner_audit"
  | "report_view"
  | "link_copy"
  | "cta_quickwins"
  | "cta_contentplan"
  | "cta_contact"
  | "share_linkedin"
  | "share_x"
  | "lead_email",
  number
>;
interface Stats {
  days: { date: string; counts: Counts }[];
  totals: Counts;
  leads: { id: string; email: string; domain: string | null; reportId: string | null; createdAt: string }[];
}

const CODE_KEY = "growth-audit-stats-code"; // kept for this browser tab only

export default function StatsPage() {
  const [code, setCode] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(withCode: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: withCode }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't load the stats.");
      sessionStorage.setItem(CODE_KEY, withCode);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load the stats.");
      sessionStorage.removeItem(CODE_KEY);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const saved = sessionStorage.getItem(CODE_KEY);
    if (saved) void load(saved);
  }, []);

  return (
    <>
      <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 pb-20 pt-6 text-ink">
        <header className="flex items-center justify-between">
          <Link href="/" aria-label="Growth Audit AI, home" className="rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-marker">
            <Logo />
          </Link>
          {stats && (
            <button type="button" onClick={() => void load(sessionStorage.getItem(CODE_KEY) ?? code)} className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-mist hover:text-ink">
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          )}
        </header>
  
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Funnel, last 30 days</h1>
          <p className="mt-2 max-w-[62ch] text-ink-soft">
            Visitors only; audits you run with the access code are counted separately. Counts only, no cookies. The one exception is emails people chose to leave under a report, listed at the bottom.
          </p>
        </div>
  
        {!stats && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void load(code);
            }}
            className="flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="stats-code" className="sr-only">
              Access code
            </label>
            <input
              id="stats-code"
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Access code"
              required
              className="flex-1 rounded-lg border-2 border-ink/20 bg-white px-4 py-3 outline-none focus:border-ink"
            />
            <button disabled={loading} className="rounded-lg bg-ink px-5 py-3 font-semibold text-white hover:bg-ink/85 disabled:opacity-60">
              {loading ? "Loading…" : "Show stats"}
            </button>
          </form>
        )}
        {error && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
  
        {stats && <Dashboard stats={stats} />}
      </main>
      <SiteFooter />
    </>
  );
}

function Dashboard({ stats }: { stats: Stats }) {
  const t = stats.totals;
  const linkedIn = t.cta_quickwins + t.cta_contentplan + (t.cta_contact ?? 0);
  const emails = t.lead_email ?? 0;

  const tiles = [
    { label: "Audits by visitors", value: t.audit_completed },
    { label: "Report views", value: t.report_view },
    { label: "LinkedIn clicks", value: linkedIn },
    { label: "Emails left", value: emails },
  ];

  const funnel = [
    { label: "Homepage visits", value: t.home_view },
    { label: "Audits started", value: t.audit_started },
    { label: "Audits completed", value: t.audit_completed },
    { label: "Report views", value: t.report_view },
    { label: "Leads (LinkedIn clicks and emails)", value: linkedIn + emails },
  ];
  const max = Math.max(1, ...funnel.map((f) => f.value));

  const recent = [...stats.days].reverse().slice(0, 14);

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.label} className="rounded-xl border border-ink/10 bg-white p-4">
            <p className="text-sm text-ink-soft">{tile.label}</p>
            <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums">{tile.value}</p>
          </li>
        ))}
      </ul>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Funnel</h2>
          <p className="mt-1 text-sm text-ink-soft">Each step with its count and how many made it from the step before.</p>
        </div>
        <ol className="flex flex-col gap-3 rounded-xl border border-ink/10 bg-white p-5">
          {funnel.map((step, i) => {
            const prev = i > 0 ? funnel[i - 1].value : null;
            const rate = prev ? Math.round((step.value / prev) * 100) : null;
            return (
              <li key={step.label} title={`${step.label}: ${step.value}${rate !== null ? ` (${rate}% of the step before)` : ""}`}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium">{step.label}</span>
                  <span className="tabular-nums">
                    <span className="font-semibold">{step.value}</span>
                    {rate !== null && <span className="ml-2 text-ink-soft">{rate}%</span>}
                  </span>
                </div>
                <div className="mt-1.5 h-3 rounded-full bg-mist">
                  <div className="h-3 rounded-full bg-ink" style={{ width: `${Math.max(step.value ? 1.5 : 0, (step.value / max) * 100)}%` }} />
                </div>
              </li>
            );
          })}
        </ol>
        <p className="text-sm text-ink-soft">
          LinkedIn clicks: {t.cta_quickwins} on the quick-wins offer, {t.cta_contentplan} on the content-plan offer, {t.cta_contact ?? 0} on the
          contact buttons. Emails left: {emails}. Reports shared: {t.link_copy} links copied, {t.share_linkedin ?? 0} on LinkedIn, {t.share_x ?? 0} on X. Your own audits: {t.owner_audit}.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Day by day</h2>
        <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
          <table className="w-full text-sm tabular-nums">
            <thead className="border-b border-ink/10 text-left text-ink-soft">
              <tr>
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 text-right font-medium">Visits</th>
                <th className="px-4 py-2.5 text-right font-medium">Audits</th>
                <th className="px-4 py-2.5 text-right font-medium">Views</th>
                <th className="px-4 py-2.5 text-right font-medium">LinkedIn</th>
                <th className="px-4 py-2.5 text-right font-medium">Emails</th>
                <th className="px-4 py-2.5 text-right font-medium">Yours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {recent.map((d) => (
                <tr key={d.date}>
                  <td className="px-4 py-2">{new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}</td>
                  <td className="px-4 py-2 text-right">{d.counts.home_view}</td>
                  <td className="px-4 py-2 text-right">{d.counts.audit_completed}</td>
                  <td className="px-4 py-2 text-right">{d.counts.report_view}</td>
                  <td className="px-4 py-2 text-right">{d.counts.cta_quickwins + d.counts.cta_contentplan + (d.counts.cta_contact ?? 0)}</td>
                  <td className="px-4 py-2 text-right">{d.counts.lead_email ?? 0}</td>
                  <td className="px-4 py-2 text-right">{d.counts.owner_audit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email leads</h2>
          <p className="mt-1 text-sm text-ink-soft">
            People who asked for the full list of fixes. Reply by hand; each email is deleted automatically after 12 months.
          </p>
        </div>
        {stats.leads.length === 0 ? (
          <p className="rounded-xl border border-ink/10 bg-white p-5 text-sm text-ink-soft">No emails yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-ink/10 text-left text-ink-soft">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium">Email</th>
                  <th className="px-4 py-2.5 font-medium">Website audited</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {stats.leads.map((lead) => (
                  <tr key={lead.id}>
                    <td className="whitespace-nowrap px-4 py-2 tabular-nums">
                      {new Date(lead.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-2">
                      <a
                        href={`mailto:${lead.email}?subject=${encodeURIComponent(`Your growth audit${lead.domain ? ` of ${lead.domain}` : ""}`)}`}
                        className="font-medium underline underline-offset-4"
                      >
                        {lead.email}
                      </a>
                    </td>
                    <td className="px-4 py-2">
                      {lead.reportId ? (
                        <a href={`/r/${lead.reportId}`} className="underline underline-offset-4">
                          {lead.domain ?? "Report"}
                        </a>
                      ) : (
                        <span className="text-ink-soft">{lead.domain ?? "–"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
