"use client";

import { useEffect, useRef, useState } from "react";
import type { SiteCheck } from "@/lib/reader/checks";
import type { WebsiteSummary } from "@/lib/reader/format";
import type { PageSpeedResult } from "@/lib/reader/pagespeed";
import type { AutomationPlan } from "@/lib/schemas/automation-plan";
import type { ContentPack } from "@/lib/schemas/content-pack";
import type { BrandVoiceResult } from "@/lib/steps/brand-voice";
import type { GrowthAuditResult } from "@/lib/steps/growth-audit";
import type { KeywordPlacement, KeywordsResult } from "@/lib/steps/keywords";
import { postText, SocialPostPreview } from "@/components/social-post";
import { SITE } from "@/lib/site";
import { trackClick } from "@/lib/track-client";
import type { ReportData } from "@/lib/store/reports";

/**
 * The full report. Used by the live audit page (sections appear as steps finish)
 * and by the saved-report page /r/[id] (everything at once).
 *
 * Order: cover, section menu, scores at a glance, quick wins, checks, speed, score details,
 * brand voice, posts, automation plan. The overview comes first; the detail is further down.
 */
export function Report({
  data,
  createdAt,
  shareUrl,
  reportId,
}: {
  data: ReportData;
  createdAt?: string;
  /** The link the Share button copies; "current" copies the page's own address. */
  shareUrl?: string | null;
  /** The saved report's id, sent with button clicks so lead alerts can name the website. */
  reportId?: string | null;
}) {
  const { checks, speed, brandVoice, audit, automation, contentPack, keywords } = data;
  // The company logo is loaded through our own server (/api/logo), never directly from the company's
  // site, so visitors' IP addresses aren't sent to third parties. Until the report is saved, the
  // company's initial is shown instead.
  const site = data.site?.brand
    ? { ...data.site, brand: { ...data.site.brand, iconUrl: data.site.brand.iconUrl && reportId ? `/api/logo/${reportId}` : null } }
    : data.site;

  const sections = [
    audit && site && { id: "overview", label: "Overview" },
    audit && { id: "scores", label: "Scores" },
    audit && { id: "quick-wins", label: "Quick wins" },
    checks && { id: "checks", label: "Checks" },
    speed && { id: "speed", label: "Speed" },
    keywords && { id: "keywords", label: "Keywords" },
    brandVoice && { id: "brand-voice", label: "Brand voice" },
    contentPack && { id: "posts", label: "Posts" },
    automation && { id: "automations", label: "Automations" },
    audit && reportId && { id: "contact", label: "Get help" },
  ].filter(Boolean) as { id: string; label: string }[];

  if (!sections.length) return null;

  return (
    <div className="flex flex-col gap-14 text-ink">
      {audit && site && <Cover audit={audit} site={site} createdAt={createdAt} shareUrl={shareUrl} reportId={reportId} />}
      {sections.length > 2 && <SectionMenu sections={sections} />}
      {audit && <ScoreGrid audit={audit} />}
      {audit && <QuickWins audit={audit} domain={site?.domain} reportId={reportId} />}
      {checks && site && <Checks checks={checks} site={site} />}
      {speed && <Speed speed={speed} />}
      {keywords && <Keywords keywords={keywords} />}
      {audit && <ScoreDetails audit={audit} />}
      {brandVoice && <BrandVoice voice={brandVoice} />}
      {contentPack && <Posts pack={contentPack} site={site} reportId={reportId} />}
      {automation && <Automations plan={automation} />}
      {audit && reportId && <LeadForm domain={site?.domain} reportId={reportId} />}
      {site && <Disclaimer domain={site.domain} name={site.brand?.name ?? site.domain} />}

    </div>
  );
}

/* ---------- Share buttons ---------- */

/**
 * Copy link, plus LinkedIn and X. These are plain links to each network's own share page: no scripts or
 * cookies from LinkedIn or X load on this site, and nothing is sent to them until someone clicks.
 */
function ShareButtons({ shareUrl, reportId, name, score }: { shareUrl: string; reportId?: string | null; name: string; score: number }) {
  // "current" means this page's own address, which is only known in the browser.
  const [url, setUrl] = useState(shareUrl === "current" ? "" : shareUrl);
  useEffect(() => {
    if (shareUrl === "current") setUrl(window.location.href.split("#")[0]);
    else setUrl(shareUrl);
  }, [shareUrl]);

  const text = `${name} scored ${score}/100 in this AI growth audit`;
  const networks = [
    {
      id: "share_linkedin" as const,
      label: "Share on LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      icon: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11H3zM9.5 9.75h3.8v1.5h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1v5.45h-4v-4.83c0-1.15-.02-2.63-1.6-2.63-1.6 0-1.85 1.25-1.85 2.55v4.91h-4z",
    },
    {
      id: "share_x" as const,
      label: "Share on X",
      href: `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      icon: "M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.78zm-1.08 16.17h1.7L7.4 4.73H5.58z",
    },
  ];

  return (
    <div className="flex items-center gap-2">
      <CopyButton
        text={url}
        label="Share report"
        className="rounded-lg border-2 border-ink px-4 py-2 text-sm font-semibold hover:bg-ink hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-marker"
        copiedLabel="Link copied"
        onCopy={() => trackClick("link_copy", reportId)}
      />
      {url &&
        networks.map((n) => (
          <a
            key={n.id}
            href={n.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={n.label}
            title={n.label}
            onClick={() => trackClick(n.id, reportId)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-ink text-ink hover:bg-ink hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-marker"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d={n.icon} />
            </svg>
          </a>
        ))}
    </div>
  );
}

/* ---------- Cover ---------- */

function Cover({
  audit,
  site,
  createdAt,
  shareUrl,
  reportId,
}: {
  audit: GrowthAuditResult;
  site: WebsiteSummary;
  createdAt?: string;
  shareUrl?: string | null;
  reportId?: string | null;
}) {
  const brand = site.brand ?? { name: nameFromDomain(site.domain), iconUrl: null, color: null };
  const date = new Date(createdAt ?? Date.now()).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return (
    <section id="overview" className="scroll-mt-24 rounded-2xl border border-ink/10 bg-white p-6 shadow-[0_20px_40px_-28px_rgba(23,32,51,0.35)] sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <CompanyLogo iconUrl={brand.iconUrl} name={brand.name} size={48} />
          <div>
            <p className="text-2xl font-bold leading-tight tracking-tight">{brand.name}</p>
            <p className="text-sm text-ink-soft">
              Automated AI analysis of {site.domain}, {date}
            </p>
          </div>
        </div>
        {shareUrl && <ShareButtons shareUrl={shareUrl} reportId={reportId} name={brand.name} score={audit.overallScore} />}
      </div>

      <div className="mt-8 grid items-center gap-8 sm:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center">
          <ScoreRing value={audit.overallScore} size={140} stroke={12}>
            <span className={`text-5xl font-bold tracking-tight ${scoreText(audit.overallScore / 10)}`}>{audit.overallScore}</span>
            <span className="text-xs text-ink-soft">out of 100</span>
          </ScoreRing>
          <p className="mt-2 font-semibold">{audit.grade}</p>
        </div>
        <div>
          <p className="max-w-[62ch] leading-relaxed">{audit.summary}</p>
          <div className="mt-5 max-w-[62ch] border-l-4 border-marker pl-4">
            <p className="text-sm font-semibold">Biggest opportunity</p>
            <p className="mt-1 font-medium leading-relaxed">{audit.biggestOpportunity}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Sticky section menu ---------- */

function SectionMenu({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  // Highlight the section currently in view.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -60% 0px" },
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav
      aria-label="Report sections"
      className="sticky top-0 z-20 -mx-6 -my-8 border-b border-ink/10 bg-white/90 px-6 backdrop-blur supports-[backdrop-filter]:bg-white/75"
    >
      <ul className="flex gap-1 overflow-x-auto py-2 text-sm [scrollbar-width:none]">
        {sections.map((s) => (
          <li key={s.id} className="shrink-0">
            <a
              href={`#${s.id}`}
              className={`block rounded-full px-3 py-1.5 font-medium ${
                active === s.id ? "bg-ink text-white" : "text-ink-soft hover:bg-mist hover:text-ink"
              }`}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ---------- Scores ---------- */

function ScoreGrid({ audit }: { audit: GrowthAuditResult }) {
  return (
    <Section id="scores" title="Scores at a glance" subtitle="Each area scored from 0 to 10 by the AI; the overall score is calculated by code.">
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {audit.categories.map((c) => (
          <li key={c.id} className="rounded-xl border border-ink/10 bg-white p-4">
            <p className="text-sm leading-snug text-ink-soft">{c.label}</p>
            <p className="mt-1">
              <span className={`text-3xl font-bold tracking-tight ${scoreText(c.score)}`}>{c.score}</span>
              <span className="text-ink-soft">/10</span>
            </p>
            <div className="mt-2 h-1.5 rounded-full bg-mist">
              <div className={`h-1.5 rounded-full ${scoreBar(c.score)}`} style={{ width: `${c.score * 10}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function ScoreDetails({ audit }: { audit: GrowthAuditResult }) {
  return (
    <Section
      id="details"
      title="Why each score"
      subtitle={`Strengths, issues and the quotes behind them. ${audit.grounding.verifiedQuotes} of ${audit.grounding.totalQuotes} quotes were found word for word on the website.`}
    >
      <div className="divide-y divide-ink/10 rounded-xl border border-ink/10 bg-white">
        {audit.categories.map((c) => (
          <details key={c.id} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
              <span>
                <span className="font-semibold">{c.label}</span>
                <span className="mt-0.5 block text-sm text-ink-soft">{c.verdict}</span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className={`font-bold ${scoreText(c.score)}`}>{c.score}/10</span>
                <Chevron />
              </span>
            </summary>
            <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <List title="Strengths" items={c.strengths} />
              <List title="Issues" items={c.issues} />
            </div>
            {c.evidence.length > 0 && (
              <ul className="mt-4 flex flex-col gap-2 text-sm">
                {c.evidence.map((e, i) => (
                  <li key={i} className="border-l-2 border-ink/15 pl-3 text-ink-soft">
                    <span className="italic">“{e.quote}”</span>{" "}
                    <span className={e.verified ? "text-emerald-700" : "text-amber-600"}>
                      {e.verified ? "verified on the site" : "not found on the site"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </details>
        ))}
      </div>
    </Section>
  );
}

/* ---------- Quick wins ---------- */

function QuickWins({ audit, domain, reportId }: { audit: GrowthAuditResult; domain?: string; reportId?: string | null }) {
  return (
    <Section id="quick-wins" title="Quick wins" subtitle="The changes most likely to grow leads and revenue, best first.">
      <ol className="flex flex-col gap-3">
        {audit.quickWins.map((w, i) => (
          <li key={i} className="flex gap-4 rounded-xl border border-ink/10 bg-white p-5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">{i + 1}</span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{w.title}</span>
                <Badge tone={levelTone(w.impact, "impact")}>Impact: {w.impact}</Badge>
                <Badge tone={levelTone(w.effort, "effort")}>Effort: {w.effort}</Badge>
              </div>
              <p className="mt-1.5 leading-relaxed">{w.action}</p>
              <p className="mt-1 text-sm text-ink-soft">{w.why}</p>
            </div>
          </li>
        ))}
        {audit.hiddenQuickWins ? (
          <HiddenQuickWins count={audit.hiddenQuickWins} start={audit.quickWins.length + 1} domain={domain} reportId={reportId} />
        ) : null}
      </ol>
    </Section>
  );
}

/**
 * The quick wins a visitor doesn't see: blurred placeholder cards (the real text never reaches the
 * browser, see lib/report-access.ts) with an offer to send the full list and help put it in place.
 */
function HiddenQuickWins({ count, start, domain, reportId }: { count: number; start: number; domain?: string; reportId?: string | null }) {
  return (
    <li className="relative">
      <div aria-hidden="true" className="pointer-events-none flex select-none flex-col gap-3 blur-[5px]">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="flex gap-4 rounded-xl border border-ink/10 bg-white p-5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">{start + i}</span>
            <div>
              <span className="font-semibold">Placeholder fix title for this website</span>
              <p className="mt-1.5">What to change, specific to this company, and where on the website.</p>
              <p className="mt-1 text-sm text-ink-soft">The effect this is expected to have on growth.</p>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-3">
        <div className="max-w-md rounded-xl bg-ink p-5 text-center text-white shadow-lg">
          <p className="font-semibold">
            {count} more {count === 1 ? "fix" : "fixes"}
            {domain ? ` for ${domain}` : ""}, ranked by impact
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-white/80">
            Message me on LinkedIn and I&apos;ll send you the full list, and help you put the fixes in place.
          </p>
          {SITE.linkedinUrl && <LinkedInButton className="mt-3 px-4 py-2 text-sm" onClick={() => trackClick("cta_quickwins", reportId)} />}
        </div>
      </div>
    </li>
  );
}

/* ---------- Checks ---------- */

function Checks({ checks, site }: { checks: SiteCheck[]; site: WebsiteSummary }) {
  const problems = checks.filter((c) => c.status !== "pass").sort((a, b) => (a.status === "fail" ? -1 : 1) - (b.status === "fail" ? -1 : 1));
  const passed = checks.filter((c) => c.status === "pass");
  return (
    <Section
      id="checks"
      title="Website checks"
      subtitle={`Measured by code, not AI, on ${site.pages.length} page${site.pages.length === 1 ? "" : "s"}: ${site.pages.map((p) => p.kind).join(", ")}${
        site.failedPages.length ? ` (${site.failedPages.length} could not be read)` : ""
      }.`}
    >
      <p className="text-lg font-semibold">
        {passed.length} passed{problems.length ? `, ${problems.length} to fix` : ", nothing to fix"}
      </p>
      {problems.length > 0 && <CheckList checks={problems} />}
      {passed.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {passed.map((c) => (
            <li key={c.id} className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-900" title={c.detail}>
              ✓ {c.label}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function CheckList({ checks }: { checks: SiteCheck[] }) {
  return (
    <ul className="divide-y divide-ink/10 rounded-xl border border-ink/10 bg-white">
      {checks.map((c) => (
        <li key={c.id} className="flex gap-3 px-5 py-3 text-sm">
          <StatusIcon status={c.status} />
          <span>
            <span className="font-semibold">{c.label}</span>
            <span className="block text-ink-soft">{c.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Speed ---------- */

function Speed({ speed }: { speed: PageSpeedResult }) {
  const scores: { label: string; value: number | null }[] = [
    { label: "Performance", value: speed.scores.performance },
    { label: "SEO", value: speed.scores.seo },
    { label: "Accessibility", value: speed.scores.accessibility },
    { label: "Best practices", value: speed.scores.bestPractices },
  ];
  const metrics = speed.checks.filter((c) => c.id !== "speed-score" && c.id !== "lighthouse-seo");
  return (
    <Section
      id="speed"
      title="Speed and mobile"
      subtitle={`Measured by Google PageSpeed Insights on a mobile phone${
        speed.field ? `, with real Chrome users over the last 28 days${speed.field.wholeSite ? " (whole website)" : ""}` : ""
      }. Not AI.`}
    >
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {scores.map((s) => (
          <li key={s.label} className="flex flex-col items-center rounded-xl border border-ink/10 bg-white px-3 py-5">
            <ScoreRing value={s.value ?? 0} size={84} stroke={8} muted={s.value === null}>
              <span className={`text-2xl font-bold ${s.value === null ? "text-ink-soft" : scoreText(s.value / 10)}`}>{s.value ?? "–"}</span>
            </ScoreRing>
            <span className="mt-2 text-sm font-medium">{s.label}</span>
          </li>
        ))}
      </ul>
      {metrics.length > 0 && <CheckList checks={metrics} />}
    </Section>
  );
}

/* ---------- Keywords ---------- */

const PLACES: { key: keyof Omit<KeywordPlacement, "mentions">; label: string }[] = [
  { key: "title", label: "Title" },
  { key: "h1", label: "H1" },
  { key: "headings", label: "Headings" },
  { key: "meta", label: "Meta" },
  { key: "url", label: "URL" },
];

function Keywords({ keywords }: { keywords: KeywordsResult }) {
  return (
    <Section
      id="keywords"
      title="Keywords"
      subtitle="The search phrases the website is built around, and five worth adding. The AI suggests the phrases; where each one appears is checked in code. These are not Google rankings."
    >
      <p className="max-w-[70ch] leading-relaxed">{keywords.summary}</p>

      {keywords.current.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-ink/10 text-left text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium">Targets today</th>
                {PLACES.map((p) => (
                  <th key={p.key} className="px-2 py-3 text-center font-medium">
                    {p.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-medium">Mentions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {keywords.current.map((k) => (
                <tr key={k.keyword}>
                  <td className="px-4 py-3">
                    <span className="font-semibold">{k.keyword}</span>
                    <span className="ml-2 whitespace-nowrap text-xs text-ink-soft">{k.intent}</span>
                  </td>
                  {PLACES.map((p) => (
                    <td key={p.key} className="px-2 py-3 text-center">
                      {k.placement[p.key] ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white" aria-label="Yes">
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                            <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-mist text-ink-soft" aria-label="No">
                          –
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right tabular-nums">{k.placement.mentions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {keywords.dropped > 0 && (
        <p className="text-xs text-ink-soft">
          {keywords.dropped} {keywords.dropped === 1 ? "keyword" : "keywords"} the AI named couldn&apos;t be found on the website, so{" "}
          {keywords.dropped === 1 ? "it was" : "they were"} left out.
        </p>
      )}

      <h3 className="mt-4 text-lg font-semibold">Worth targeting next</h3>
      <ol className="grid gap-3 sm:grid-cols-2">
        {keywords.suggested.map((k, i) => (
          <li key={k.keyword} className="flex gap-4 rounded-xl border border-ink/10 bg-white p-5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-marker text-sm font-bold text-ink">{i + 1}</span>
            <div className="min-w-0">
              <p className="font-semibold">{k.keyword}</p>
              <p className="mt-1 flex flex-wrap gap-2">
                <Tag>{k.intent}</Tag>
                <Tag tone={k.onSite ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}>
                  {k.onSite ? "Mentioned, not targeted" : "Not on the site yet"}
                </Tag>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{k.why}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function Tag({ children, tone = "bg-mist text-ink" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>{children}</span>;
}

/* ---------- Brand voice ---------- */

function BrandVoice({ voice }: { voice: BrandVoiceResult }) {
  const p = voice.profile;
  return (
    <Section
      id="brand-voice"
      title="Brand voice"
      subtitle={`How the website sounds and who it speaks to. ${voice.grounding.verifiedQuotes} of ${voice.grounding.totalQuotes} quotes were found word for word on the website.`}
    >
      <div className="rounded-xl border border-ink/10 bg-white p-6">
        <p className="text-2xl font-bold capitalize tracking-tight">{p.tone.join(", ")}</p>
        <p className="mt-2 max-w-[65ch] leading-relaxed text-ink-soft">{p.toneSummary}</p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold">Positioning</p>
            <p className="mt-1 leading-relaxed">{p.positioning}</p>
          </div>
          <div>
            <p className="text-sm font-semibold">Audience</p>
            <p className="mt-1 leading-relaxed">
              {p.audience.primary}
              {p.audience.secondary ? ` Also: ${p.audience.secondary}` : ""}
            </p>
          </div>
        </div>
        {/* Key messages and word lists are still generated (the post writer uses them) but not shown. */}
      </div>
    </Section>
  );
}

/* ---------- Posts ---------- */

function Posts({ pack, site, reportId }: { pack: ContentPack; site?: WebsiteSummary; reportId?: string | null }) {
  // New reports have a LinkedIn and an X post. Older ones have one or 14; at most two are shown.
  const posts = pack.posts.slice(0, 2);
  if (!posts.length) return null;
  const domain = site?.domain ?? "";
  // Reports saved before brand detection get a name from the domain and the company's initial as avatar.
  const brand = site?.brand ?? { name: nameFromDomain(domain), iconUrl: null, color: null };
  return (
    <Section
      id="posts"
      title={posts.length > 1 ? "Social media posts" : "Social media post"}
      subtitle={`Ready to post, in the brand's voice, previewed as they would look on ${posts.map((p) => p.platform).join(" and ")}.`}
    >
      <div className={`grid items-start gap-5 ${posts.length > 1 ? "md:grid-cols-2" : "max-w-md"}`}>
        {posts.map((post, i) => (
          <div key={i}>
            <SocialPostPreview post={post} brand={brand} domain={domain} socialLinks={site?.socialLinks ?? []} />
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <CopyButton
                text={postText(post)}
                label={`Copy ${post.platform} post`}
                className="rounded-md border border-ink/20 bg-white px-2.5 py-1 font-medium hover:border-ink"
              />
              <span className="text-ink-soft">Theme: {post.pillar}</span>
            </div>
          </div>
        ))}
      </div>

      {SITE.linkedinUrl && (
        <div className="rounded-xl bg-ink p-6 text-white">
          <h3 className="text-lg font-semibold">Want a full content plan{domain ? ` for ${domain}` : ""}?</h3>
          <p className="mt-2 max-w-[60ch] leading-relaxed text-white/80">
            Two weeks of posts like these, built on the three themes that suit the company best:{" "}
            {pack.pillars.map((p) => p.name).join(", ")}. Send me a message and I&apos;ll put it together.
          </p>
          <LinkedInButton className="mt-4 px-5 py-2.5" onClick={() => trackClick("cta_contentplan", reportId)} />
        </div>
      )}
    </Section>
  );
}

/* ---------- Automation plan ---------- */

function Automations({ plan }: { plan: AutomationPlan }) {
  return (
    <Section id="automations" title="Automation plan" subtitle={plan.summary}>
      <ol className="flex flex-col gap-4">
        {/* Older reports have 4–6 automations; the first three are the most valuable. */}
        {plan.automations.slice(0, 3).map((a, i) => (
          <li key={i} className="rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-semibold">
                {i + 1}. {a.name}
              </span>
              <Badge tone={levelTone(a.impact, "impact")}>Impact: {a.impact}</Badge>
              <Badge tone={levelTone(a.effort, "effort")}>Effort: {a.effort}</Badge>
            </div>
            <p className="mt-1 text-ink-soft">{a.goal}</p>

            {/* The workflow as a flow: what starts it, what happens, what it achieves. */}
            <ol className="mt-5 flex flex-col">
              <FlowStep kind="trigger" label="Trigger" text={a.trigger} />
              {a.steps.map((s, j) => (
                <FlowStep key={j} kind="step" label={`Step ${j + 1}`} text={s} />
              ))}
              <FlowStep kind="result" label="Result" text={a.metric} last />
            </ol>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              {a.tools.map((t) => (
                <span key={t} className="rounded-full bg-mist px-3 py-1">
                  {t}
                </span>
              ))}
            </div>
            {a.aiRole && (
              <p className="mt-3 rounded-lg bg-mist/70 px-4 py-3 text-sm leading-relaxed">
                <span className="font-semibold">Where AI helps: </span>
                {a.aiRole}
              </p>
            )}
          </li>
        ))}
      </ol>
    </Section>
  );
}

function FlowStep({ kind, label, text, last = false }: { kind: "trigger" | "step" | "result"; label: string; text: string; last?: boolean }) {
  const dot =
    kind === "trigger" ? "bg-ink ring-4 ring-mist" : kind === "result" ? "bg-emerald-500 ring-4 ring-emerald-100" : "bg-white border-2 border-ink/30";
  return (
    <li className="relative flex gap-4 pb-4 last:pb-0">
      {!last && <span aria-hidden="true" className="absolute left-[7px] top-4 h-full w-px bg-ink/15" />}
      <span aria-hidden="true" className={`relative mt-1 h-[15px] w-[15px] shrink-0 rounded-full ${dot}`} />
      <div className="text-sm">
        <span className="font-semibold">{label}: </span>
        <span className={kind === "step" ? "text-ink-soft" : ""}>{text}</span>
      </div>
    </li>
  );
}

/* ---------- Email lead form ---------- */

/**
 * An optional way to get in touch without LinkedIn: the email is stored for the owner (see /stats)
 * and the owner replies by hand. Nothing is sent automatically, so the copy promises a reply, not an email.
 */
function LeadForm({ domain, reportId }: { domain?: string; reportId: string }) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState(""); // hidden field that only bots fill in
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, reportId, company }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Something went wrong. Please try again.");
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setState("idle");
    }
  }

  return (
    <section id="contact" className="scroll-mt-24 rounded-2xl bg-ink p-6 text-white sm:p-8">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Want a hand putting this into practice?</h2>
          <p className="mt-2 leading-relaxed text-white/75">
            Leave your email and I&apos;ll send you the full list of fixes{domain ? ` for ${domain}` : ""}, with where I&apos;d start.
          </p>
        </div>
        {state === "sent" ? (
          <p role="status" className="rounded-xl bg-white/10 p-5 font-medium">
            Thanks! I&apos;ll get back to you by email{domain ? ` about ${domain}` : ""}.
          </p>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label htmlFor="lead-email" className="sr-only">
                Your email
              </label>
              <input
                id="lead-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="min-w-0 flex-1 rounded-lg border-2 border-transparent bg-white px-4 py-3 text-ink outline-none placeholder:text-ink-soft/70 focus:border-marker"
              />
              <button
                type="submit"
                disabled={state === "sending"}
                className="rounded-lg bg-marker px-5 py-3 font-semibold text-ink hover:bg-marker/85 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 disabled:opacity-70"
              >
                {state === "sending" ? "Sending…" : "Send me the fixes"}
              </button>
            </div>
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor="lead-company">Company</label>
              <input id="lead-company" tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            {error && (
              <p role="alert" className="text-sm text-red-200">
                {error}
              </p>
            )}
            <p className="text-sm text-white/60">
              Optional. I only use your email to reply to you; it&apos;s deleted after 12 months.{" "}
              <a href="/privacy" className="underline underline-offset-4 hover:text-white">
                Privacy policy
              </a>
              {SITE.linkedinUrl && (
                <>
                  {" "}or{" "}
                  <a href={SITE.linkedinUrl} target="_blank" rel="noreferrer" onClick={() => trackClick("cta_contact", reportId)} className="font-semibold text-white underline underline-offset-4 hover:text-marker">
                    message me on LinkedIn
                  </a>
                </>
              )}
              .
            </p>
          </form>
        )}
      </div>
    </section>
  );
}

/* ---------- Disclaimer ---------- */

/**
 * Says what the report is and isn't: an automated AI analysis of public pages, possibly wrong,
 * not advice, and not endorsed by the company. Also covers the EU AI Act's transparency duty
 * to make AI-generated text recognisable as such.
 */
function Disclaimer({ domain, name }: { domain: string; name: string }) {
  return (
    <aside className="border-t border-ink/10 pt-6 text-xs leading-relaxed text-ink-soft">
      <p className="max-w-[80ch]">
        This report was generated automatically with AI (Google Gemini), using only the public website of {domain} and
        Google PageSpeed measurements. It can contain errors and is not professional advice. Growth Audit AI is an
        independent project and is not affiliated with or endorsed by {name}. Company names and logos belong to their
        owners and are shown only to identify the website analysed.
      </p>
    </aside>
  );
}

/* ---------- Small building blocks ---------- */

function Section({ id, title, subtitle, children }: { id: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-24 flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-1 max-w-[70ch] text-sm leading-relaxed text-ink-soft">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

/** A score in a ring, filled by the score (Google PageSpeed uses the same style). */
function ScoreRing({
  value,
  size,
  stroke,
  muted = false,
  children,
}: {
  value: number;
  size: number;
  stroke: number;
  muted?: boolean;
  children: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const color = muted ? "#cbd2dc" : value >= 70 ? "#10b981" : value >= 45 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef1f5" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - Math.max(0, Math.min(100, value)) / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

function CompanyLogo({ iconUrl, name, size }: { iconUrl: string | null; name: string; size: number }) {
  const [failed, setFailed] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  // An image can fail before React is ready to hear about it (on the saved-report page it loads with the HTML),
  // so check once after loading too; a broken image has no natural width.
  useEffect(() => {
    const el = img.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, []);
  if (iconUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- the company's own icon, loaded from their site
      <img
        ref={img}
        src={iconUrl}
        alt=""
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="shrink-0 rounded-xl border border-ink/10 bg-[#e9ebee] object-contain"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-xl bg-ink font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function StatusIcon({ status }: { status: SiteCheck["status"] }) {
  const style = {
    pass: "bg-emerald-100 text-emerald-800",
    warn: "bg-amber-100 text-amber-800",
    fail: "bg-red-100 text-red-800",
  }[status];
  const label = { pass: "Passed", warn: "Needs attention", fail: "Failed" }[status];
  return (
    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${style}`} aria-label={label} role="img">
      {status === "pass" ? "✓" : status === "warn" ? "!" : "✕"}
    </span>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="font-semibold">{title}</p>
      <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-5 leading-relaxed">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function Badge({ children, tone = "bg-mist text-ink" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>{children}</span>;
}

/** High impact and low effort are good news (green); the opposite is amber. */
function levelTone(level: string, kind: "impact" | "effort"): string {
  const good = kind === "impact" ? level === "high" : level === "low";
  const bad = kind === "impact" ? level === "low" : level === "high";
  return good ? "bg-emerald-50 text-emerald-900" : bad ? "bg-amber-50 text-amber-900" : "bg-mist text-ink";
}

function LinkedInButton({ className = "", onClick }: { className?: string; onClick?: () => void }) {
  return (
    <a
      href={SITE.linkedinUrl}
      onClick={onClick}
      target="_blank"
      rel="noreferrer"
      className={`inline-block rounded-lg bg-white font-semibold text-ink hover:bg-marker focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-marker ${className}`}
    >
      Message me on LinkedIn
    </a>
  );
}

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-soft transition-transform group-open:rotate-180" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function CopyButton({
  text,
  label,
  className,
  copiedLabel = "Copied",
  onCopy,
}: {
  text: string;
  label: string;
  className?: string;
  copiedLabel?: string;
  onCopy?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          onCopy?.();
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className={className ?? "mt-2 text-xs font-medium text-ink-soft hover:text-ink"}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}

/** "acme-labs.co.uk" → "Acme Labs" (kept here so the browser bundle doesn't pull in the HTML parser). */
function nameFromDomain(domain: string): string {
  const first = domain.replace(/^www\./, "").split(".")[0] ?? domain;
  return (
    first
      .split(/[-_]/)
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ") || "Company"
  );
}

const scoreText = (score10: number) => (score10 >= 7 ? "text-emerald-700" : score10 >= 4.5 ? "text-amber-600" : "text-red-600");
const scoreBar = (score10: number) => (score10 >= 7 ? "bg-emerald-500" : score10 >= 4.5 ? "bg-amber-400" : "bg-red-500");
