"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { SiteCheck } from "@/lib/reader/checks";
import type { WebsiteSummary } from "@/lib/reader/format";
import type { PageSpeedResult } from "@/lib/reader/pagespeed";
import type { AutomationPlan } from "@/lib/schemas/automation-plan";
import type { ContentPack } from "@/lib/schemas/content-pack";
import type { BrandVoiceResult } from "@/lib/steps/brand-voice";
import type { GrowthAuditResult } from "@/lib/steps/growth-audit";
import type { KeywordPlacement, KeywordsResult } from "@/lib/steps/keywords";
import type { CompetitorResult } from "@/lib/steps/competitors";
import { postText, SocialPostPreview } from "@/components/social-post";
import { SITE } from "@/lib/site";
import { trackClick } from "@/lib/track-client";
import { BADGE_MIN_SCORE } from "@/lib/badge";
import type { ReportData } from "@/lib/store/reports";
import { LOCALES, type Lang } from "@/lib/i18n";
import { REPORT_TEXT, joinList, type ReportText } from "@/lib/report-text";

// The report's language and texts, available to every part of the report.
const TextContext = createContext<{ t: ReportText; lang: Lang }>({ t: REPORT_TEXT.en, lang: "en" });
const useText = () => useContext(TextContext);

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
  const { checks, speed, brandVoice, audit, automation, contentPack, keywords, competitors } = data;
  // The company logo is loaded through our own server (/api/logo), never directly from the company's
  // site, so visitors' IP addresses aren't sent to third parties. Until the report is saved, the
  // company's initial is shown instead.
  const site = data.site?.brand
    ? { ...data.site, brand: { ...data.site.brand, iconUrl: data.site.brand.iconUrl && reportId ? `/api/logo/${reportId}` : null } }
    : data.site;

  const lang: Lang = data.lang ?? "en";
  const t = REPORT_TEXT[lang];
  const sections = [
    audit && site && { id: "overview", label: t.menu.overview },
    audit && { id: "scores", label: t.menu.scores },
    audit && competitors?.length && { id: "compare", label: t.menu.compare },
    audit && { id: "quick-wins", label: t.menu.quickWins },
    checks && { id: "checks", label: t.menu.checks },
    speed && { id: "speed", label: t.menu.speed },
    keywords && { id: "keywords", label: t.menu.keywords },
    brandVoice && { id: "brand-voice", label: t.menu.brandVoice },
    contentPack && { id: "posts", label: t.menu.posts },
    automation && { id: "automations", label: t.menu.automations },
    audit && reportId && { id: "contact", label: t.menu.contact },
  ].filter(Boolean) as { id: string; label: string }[];

  if (!sections.length) return null;

  return (
    <TextContext.Provider value={{ t, lang }}>
    <div className="report-print flex flex-col gap-14 text-ink">
      {audit && site && <Cover audit={audit} site={site} createdAt={createdAt} shareUrl={shareUrl} reportId={reportId} />}
      {sections.length > 2 && <SectionMenu sections={sections} />}
      {audit && <ScoreGrid audit={audit} />}
      {audit && site && competitors?.length ? <Compare audit={audit} site={site} competitors={competitors} /> : null}
      {audit && <QuickWins audit={audit} domain={site?.domain} reportId={reportId} />}
      {checks && site && <Checks checks={checks} site={site} />}
      {speed && <Speed speed={speed} />}
      {keywords && <Keywords keywords={keywords} />}
      {audit && <ScoreDetails audit={audit} />}
      {brandVoice && <BrandVoice voice={brandVoice} />}
      {contentPack && <Posts pack={contentPack} site={site} reportId={reportId} />}
      {automation && <Automations plan={automation} />}
      {audit && reportId && audit.overallScore >= BADGE_MIN_SCORE && <ScoreBadge audit={audit} reportId={reportId} />}
      {audit && reportId && <LeadForm domain={site?.domain} reportId={reportId} />}
      {site && (
        <Disclaimer
          domain={site.domain}
          name={site.brand?.name ?? site.domain}
          competitors={(competitors ?? []).filter((c) => "overallScore" in c).map((c) => c.domain)}
        />
      )}
    </div>
    </TextContext.Provider>
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

  const { t } = useText();
  const text = t.shareText(name, score);
  const networks = [
    {
      id: "share_linkedin" as const,
      label: t.shareOn("LinkedIn"),
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      icon: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11H3zM9.5 9.75h3.8v1.5h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1v5.45h-4v-4.83c0-1.15-.02-2.63-1.6-2.63-1.6 0-1.85 1.25-1.85 2.55v4.91h-4z",
    },
    {
      id: "share_x" as const,
      label: t.shareOn("X"),
      href: `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      icon: "M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.78zm-1.08 16.17h1.7L7.4 4.73H5.58z",
    },
  ];

  return (
    <div className="flex items-center gap-2 print:hidden">
      <button
        type="button"
        onClick={() => saveAsPdf(t.cardLabel, name)}
        title={t.savePdf}
        aria-label={t.savePdf}
        className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-ink text-ink hover:bg-ink hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-marker"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
        </svg>
      </button>
      <CopyButton
        text={url}
        label={t.shareReport}
        className="rounded-lg border-2 border-ink px-4 py-2 text-sm font-semibold hover:bg-ink hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-marker"
        copiedLabel={t.linkCopied}
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

/**
 * Opens the browser's print dialog, where "Save as PDF" is one click. The print layout (app/globals.css)
 * hides menus and buttons; here the score details are folded open and the file name is suggested.
 */
function saveAsPdf(label: string, name: string) {
  const closed = [...document.querySelectorAll<HTMLDetailsElement>(".report-print details:not([open])")];
  const title = document.title;
  closed.forEach((d) => (d.open = true));
  document.title = `${label} – ${name}`;
  const restore = () => {
    closed.forEach((d) => (d.open = false));
    document.title = title;
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  window.print();
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
  const { t, lang } = useText();
  const brand = site.brand ?? { name: nameFromDomain(site.domain), iconUrl: null, color: null };
  const date = new Date(createdAt ?? Date.now()).toLocaleDateString(LOCALES[lang], { day: "numeric", month: "long", year: "numeric" });
  return (
    <section id="overview" className="scroll-mt-24 rounded-2xl border border-ink/10 bg-white p-6 shadow-[0_20px_40px_-28px_rgba(23,32,51,0.35)] sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <CompanyLogo iconUrl={brand.iconUrl} name={brand.name} size={48} />
          <div>
            <p className="text-2xl font-bold leading-tight tracking-tight">{brand.name}</p>
            <p className="text-sm text-ink-soft">
              {t.analysisOf(site.domain, date)}
            </p>
          </div>
        </div>
        {shareUrl && <ShareButtons shareUrl={shareUrl} reportId={reportId} name={brand.name} score={audit.overallScore} />}
      </div>

      <div className="mt-8 grid items-center gap-8 sm:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center">
          <ScoreRing value={audit.overallScore} size={140} stroke={12}>
            <span className={`text-5xl font-bold tracking-tight ${scoreText(audit.overallScore / 10)}`}>{audit.overallScore}</span>
            <span className="text-xs text-ink-soft">{t.outOf100}</span>
          </ScoreRing>
          <p className="mt-2 font-semibold">{t.grade[audit.grade] ?? audit.grade}</p>
        </div>
        <div>
          <p className="max-w-[62ch] leading-relaxed">{audit.summary}</p>
          <div className="mt-5 max-w-[62ch] border-l-4 border-marker pl-4">
            <p className="text-sm font-semibold">{t.biggestOpportunity}</p>
            <p className="mt-1 font-medium leading-relaxed">{audit.biggestOpportunity}</p>
          </div>
        </div>
      </div>
      <BenchmarkLine score={audit.overallScore} />
    </section>
  );
}

/**
 * Where this score sits among every website audited so far: a 0–100 scale with this score and the average.
 * Loaded after the report, so it always reflects the latest numbers; hidden until there are 10 audits.
 */
function BenchmarkLine({ score }: { score: number }) {
  const { t } = useText();
  const [data, setData] = useState<{ total: number; averageScore: number; betterThan: number } | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/benchmark?score=${score}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !cancelled && setData(d))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [score]);
  if (!data) return null;
  return (
    <div className="mt-8 border-t border-ink/10 pt-5">
      <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
        <span className="text-ink-soft">{t.benchmark(data.averageScore, data.total)}</span>
        <span className="font-semibold">{t.betterThan(data.betterThan)}</span>
      </p>
      <div className="relative mt-3 h-2 rounded-full bg-mist" aria-hidden="true">
        <div className="absolute inset-y-0 left-0 rounded-full bg-ink/10" style={{ width: `${data.averageScore}%` }} />
        <div className="absolute -top-1 h-4 w-0.5 rounded-full bg-ink/40" style={{ left: `${data.averageScore}%` }} title="Average" />
        <div
          className={`absolute -top-1.5 h-5 w-5 -translate-x-1/2 rounded-full border-[3px] border-white shadow ${scoreBar(score / 10)}`}
          style={{ left: `${score}%` }}
        />
      </div>
    </div>
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
      className="sticky top-0 print:hidden z-20 -mx-6 -my-8 border-b border-ink/10 bg-white/90 px-6 backdrop-blur supports-[backdrop-filter]:bg-white/75"
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
  const { t } = useText();
  return (
    <Section id="scores" title={t.scoresTitle} subtitle={t.scoresSubtitle}>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {audit.categories.map((c) => (
          <li key={c.id} className="rounded-xl border border-ink/10 bg-white p-4">
            <p className="text-sm leading-snug text-ink-soft">{t.category[c.id] ?? c.label}</p>
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
  const { t } = useText();
  return (
    <Section id="details" title={t.detailsTitle} subtitle={t.detailsSubtitle(audit.grounding.verifiedQuotes, audit.grounding.totalQuotes)}>
      <div className="divide-y divide-ink/10 rounded-xl border border-ink/10 bg-white">
        {audit.categories.map((c) => (
          <details key={c.id} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
              <span>
                <span className="font-semibold">{t.category[c.id] ?? c.label}</span>
                <span className="mt-0.5 block text-sm text-ink-soft">{c.verdict}</span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className={`font-bold ${scoreText(c.score)}`}>{c.score}/10</span>
                <Chevron />
              </span>
            </summary>
            <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <List title={t.strengths} items={c.strengths} />
              <List title={t.issues} items={c.issues} />
            </div>
            {c.evidence.length > 0 && (
              <ul className="mt-4 flex flex-col gap-2 text-sm">
                {c.evidence.map((e, i) => (
                  <li key={i} className="border-l-2 border-ink/15 pl-3 text-ink-soft">
                    <span className="italic">“{e.quote}”</span>{" "}
                    <span className={e.verified ? "text-emerald-700" : "text-amber-600"}>
                      {e.verified ? t.verified : t.notFound}
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

/* ---------- Competitor comparison ---------- */

/**
 * The optional comparison: the same six areas for this site and up to two competitors. The leader in each row
 * is marked, and the lines under the table (where this site leads or trails) are worked out by code, not AI.
 */
function Compare({ audit, site, competitors }: { audit: GrowthAuditResult; site: WebsiteSummary; competitors: CompetitorResult[] }) {
  const { t, lang } = useText();
  const scored = competitors.filter((c): c is Extract<CompetitorResult, { overallScore: number }> => "overallScore" in c);
  const failed = competitors.filter((c) => "error" in c);
  const columns = [
    { key: "me", name: site.brand?.name ?? site.domain, domain: site.domain, me: true, overall: audit.overallScore, scores: Object.fromEntries(audit.categories.map((c) => [c.id, c.score])) },
    ...scored.map((c) => ({ key: c.domain, name: c.name, domain: c.domain, me: false, overall: c.overallScore, scores: Object.fromEntries(c.categories.map((x) => [x.id, x.score])) })),
  ];
  const label = (id: string) => t.category[id] ?? audit.categories.find((c) => c.id === id)?.label ?? id;
  const ids = audit.categories.map((c) => c.id);

  // Where this site is ahead of every competitor, and where each competitor is ahead of it.
  const leads = ids.filter((id) => scored.length > 0 && scored.every((c) => (columns[0].scores[id] ?? 0) > (c.categories.find((x) => x.id === id)?.score ?? 0)));
  const trails = scored
    .map((c) => ({ name: c.name, areas: ids.filter((id) => (c.categories.find((x) => x.id === id)?.score ?? 0) > (columns[0].scores[id] ?? 0)) }))
    .filter((r) => r.areas.length);

  return (
    <Section id="compare" title={t.compareTitle} subtitle={t.compareSubtitle}>
      {scored.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-ink/10 text-left">
              <tr>
                <th className="px-4 py-3" />
                {columns.map((col) => (
                  <th key={col.key} className="px-4 py-3 text-center align-bottom">
                    <span className={`block font-semibold ${col.me ? "text-ink" : "text-ink-soft"}`}>{col.name}</span>
                    <span className="block text-xs font-normal text-ink-soft">{col.me ? t.thisSite : col.domain}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {ids.map((id) => {
                const best = Math.max(...columns.map((col) => col.scores[id] ?? 0));
                return (
                  <tr key={id}>
                    <td className="px-4 py-3 text-ink-soft">{label(id)}</td>
                    {columns.map((col) => {
                      const score = col.scores[id] ?? 0;
                      return (
                        <td key={col.key} className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex min-w-9 justify-center rounded-full px-2 py-0.5 font-bold tabular-nums ${scoreText(score)} ${
                              score === best ? "bg-marker/40 ring-1 ring-marker" : ""
                            }`}
                          >
                            {score}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              <tr className="bg-mist/60">
                <td className="px-4 py-3 font-semibold">{t.overall}</td>
                {columns.map((col) => {
                  const best = Math.max(...columns.map((c) => c.overall));
                  return (
                    <td key={col.key} className="px-4 py-3 text-center">
                      <span className={`text-lg font-bold tabular-nums ${scoreText(col.overall / 10)} ${col.overall === best ? "underline decoration-marker decoration-4 underline-offset-4" : ""}`}>
                        {col.overall}
                      </span>
                      <span className="text-xs text-ink-soft">/100</span>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}
      {(leads.length > 0 || trails.length > 0) && (
        <ul className="flex flex-col gap-1.5 text-sm">
          {leads.length > 0 && (
            <li className="flex gap-2">
              <span className="text-emerald-700">▲</span>
              {t.leads(joinList(leads.map(label), lang))}
            </li>
          )}
          {trails.map((r) => (
            <li key={r.name} className="flex gap-2">
              <span className="text-amber-600">▼</span>
              {t.trails(joinList(r.areas.map(label), lang), r.name)}
            </li>
          ))}
        </ul>
      )}
      {failed.map((c) => (
        <p key={c.domain} className="text-xs text-ink-soft">
          {t.compareFailed(c.domain)}
        </p>
      ))}
    </Section>
  );
}

/* ---------- Quick wins ---------- */

function QuickWins({ audit, domain, reportId }: { audit: GrowthAuditResult; domain?: string; reportId?: string | null }) {
  const { t } = useText();
  return (
    <Section id="quick-wins" title={t.quickWinsTitle} subtitle={t.quickWinsSubtitle}>
      <ol className="flex flex-col gap-3">
        {audit.quickWins.map((w, i) => (
          <li key={i} className="flex gap-4 rounded-xl border border-ink/10 bg-white p-5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">{i + 1}</span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{w.title}</span>
                <Badge tone={levelTone(w.impact, "impact")}>
                  {t.impact}: {t.level[w.impact] ?? w.impact}
                </Badge>
                <Badge tone={levelTone(w.effort, "effort")}>
                  {t.effort}: {t.level[w.effort] ?? w.effort}
                </Badge>
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
  const { t } = useText();
  return (
    <li className="relative">
      <div aria-hidden="true" className="pointer-events-none flex select-none flex-col gap-3 blur-[5px]">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="flex gap-4 rounded-xl border border-ink/10 bg-white p-5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">{start + i}</span>
            <div>
              <span className="font-semibold">{t.placeholder[0]}</span>
              <p className="mt-1.5">{t.placeholder[1]}</p>
              <p className="mt-1 text-sm text-ink-soft">{t.placeholder[2]}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-3">
        <div className="max-w-md rounded-xl bg-ink p-5 text-center text-white shadow-lg">
          <p className="font-semibold">{t.hiddenTitle(count, domain)}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-white/80">{t.hiddenText}</p>
          {SITE.linkedinUrl && <LinkedInButton className="mt-3 px-4 py-2 text-sm" onClick={() => trackClick("cta_quickwins", reportId)} />}
        </div>
      </div>
    </li>
  );
}

/* ---------- Checks ---------- */

function Checks({ checks, site }: { checks: SiteCheck[]; site: WebsiteSummary }) {
  const { t } = useText();
  const problems = checks.filter((c) => c.status !== "pass").sort((a, b) => (a.status === "fail" ? -1 : 1) - (b.status === "fail" ? -1 : 1));
  const passed = checks.filter((c) => c.status === "pass");
  return (
    <Section
      id="checks"
      title={t.checksTitle}
      subtitle={t.checksSubtitle(
        site.pages.map((p) => t.pageKind[p.kind] ?? p.kind),
        site.failedPages.length,
      )}
    >
      <p className="text-lg font-semibold">
        {t.passedSummary(passed.length, problems.length)}
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
  const { t } = useText();
  const scores: { label: string; value: number | null }[] = [
    { label: t.speedScores.performance, value: speed.scores.performance },
    { label: t.speedScores.seo, value: speed.scores.seo },
    { label: t.speedScores.accessibility, value: speed.scores.accessibility },
    { label: t.speedScores.bestPractices, value: speed.scores.bestPractices },
  ];
  const metrics = speed.checks.filter((c) => c.id !== "speed-score" && c.id !== "lighthouse-seo");
  return (
    <Section
      id="speed"
      title={t.speedTitle}
      subtitle={t.speedSubtitle(Boolean(speed.field), Boolean(speed.field?.wholeSite))}
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

const PLACES: (keyof Omit<KeywordPlacement, "mentions">)[] = ["title", "h1", "headings", "meta", "url"];

function Keywords({ keywords }: { keywords: KeywordsResult }) {
  const { t } = useText();
  return (
    <Section id="keywords" title={t.keywordsTitle} subtitle={t.keywordsSubtitle}>
      <p className="max-w-[70ch] leading-relaxed">{keywords.summary}</p>

      {keywords.current.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-ink/10 text-left text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium">{t.targetsToday}</th>
                {PLACES.map((p) => (
                  <th key={p} className="px-2 py-3 text-center font-medium">
                    {t.places[p]}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-medium">{t.mentions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {keywords.current.map((k) => (
                <tr key={k.keyword}>
                  <td className="px-4 py-3">
                    <span className="font-semibold">{k.keyword}</span>
                    <span className="ml-2 whitespace-nowrap text-xs text-ink-soft">{t.intent[k.intent] ?? k.intent}</span>
                  </td>
                  {PLACES.map((p) => (
                    <td key={p} className="px-2 py-3 text-center">
                      {k.placement[p] ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white" aria-label={t.yes}>
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                            <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-mist text-ink-soft" aria-label={t.no}>
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
        <p className="text-xs text-ink-soft">{t.dropped(keywords.dropped)}</p>
      )}

      <h3 className="mt-4 text-lg font-semibold">{t.worthTargeting}</h3>
      <ol className="grid gap-3 sm:grid-cols-2">
        {keywords.suggested.map((k, i) => (
          <li key={k.keyword} className="flex gap-4 rounded-xl border border-ink/10 bg-white p-5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-marker text-sm font-bold text-ink">{i + 1}</span>
            <div className="min-w-0">
              <p className="font-semibold">{k.keyword}</p>
              <p className="mt-1 flex flex-wrap gap-2">
                <Tag>{t.intent[k.intent] ?? k.intent}</Tag>
                <Tag tone={k.onSite ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}>
                  {k.onSite ? t.mentionedNotTargeted : t.notOnSite}
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
  const { t } = useText();
  const p = voice.profile;
  return (
    <Section id="brand-voice" title={t.voiceTitle} subtitle={t.voiceSubtitle(voice.grounding.verifiedQuotes, voice.grounding.totalQuotes)}>
      <div className="rounded-xl border border-ink/10 bg-white p-6">
        <p className="text-2xl font-bold capitalize tracking-tight">{p.tone.join(", ")}</p>
        <p className="mt-2 max-w-[65ch] leading-relaxed text-ink-soft">{p.toneSummary}</p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold">{t.positioning}</p>
            <p className="mt-1 leading-relaxed">{p.positioning}</p>
          </div>
          <div>
            <p className="text-sm font-semibold">{t.audience}</p>
            <p className="mt-1 leading-relaxed">
              {p.audience.primary}
              {p.audience.secondary ? ` ${t.also} ${p.audience.secondary}` : ""}
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
  const { t, lang } = useText();
  // New reports have a LinkedIn and an X post. Older ones have one or 14; at most two are shown.
  const posts = pack.posts.slice(0, 2);
  if (!posts.length) return null;
  const domain = site?.domain ?? "";
  // Reports saved before brand detection get a name from the domain and the company's initial as avatar.
  const brand = site?.brand ?? { name: nameFromDomain(domain), iconUrl: null, color: null };
  return (
    <Section
      id="posts"
      title={t.postsTitle(posts.length)}
      subtitle={t.postsSubtitle(posts.map((p) => p.platform))}
    >
      {/* Both cards stretch to the same height, so the copy buttons underneath line up. */}
      <div className={`grid gap-5 ${posts.length > 1 ? "md:grid-cols-2" : "max-w-md"}`}>
        {posts.map((post, i) => (
          <div key={i} className="flex flex-col">
            <div className="flex-1">
              <SocialPostPreview post={post} brand={brand} domain={domain} socialLinks={site?.socialLinks ?? []} lang={lang} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <CopyButton
                text={postText(post)}
                label={t.copyPost(post.platform)}
                copiedLabel={t.copied}
                className="rounded-md border border-ink/20 bg-white px-2.5 py-1 font-medium hover:border-ink"
              />
              <span className="text-ink-soft">
                {t.theme}: {post.pillar}
              </span>
              {/* X has a 280-character limit; older reports were written before it, so only show the count when it fits. */}
              {post.platform === "X" && postText(post).length <= 280 && (
                <span className="ml-auto text-stone-400">
                  {postText(post).length}/280 {t.characters}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {SITE.linkedinUrl && (
        <div className="rounded-xl bg-ink p-6 text-white print:hidden">
          <h3 className="text-lg font-semibold">{t.contentPlanTitle(domain)}</h3>
          <p className="mt-2 max-w-[60ch] leading-relaxed text-white/80">{t.contentPlanText(joinList(pack.pillars.map((p) => p.name), lang))}</p>
          <LinkedInButton className="mt-4 px-5 py-2.5" onClick={() => trackClick("cta_contentplan", reportId)} />
        </div>
      )}
    </Section>
  );
}

/* ---------- Automation plan ---------- */

function Automations({ plan }: { plan: AutomationPlan }) {
  const { t } = useText();
  return (
    <Section id="automations" title={t.automationsTitle} subtitle={plan.summary}>
      <ol className="flex flex-col gap-4">
        {/* Older reports have 4–6 automations; the first three are the most valuable. */}
        {plan.automations.slice(0, 3).map((a, i) => (
          <li key={i} className="rounded-xl border border-ink/10 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-semibold">
                {i + 1}. {a.name}
              </span>
              <Badge tone={levelTone(a.impact, "impact")}>
                {t.impact}: {t.level[a.impact] ?? a.impact}
              </Badge>
              <Badge tone={levelTone(a.effort, "effort")}>
                {t.effort}: {t.level[a.effort] ?? a.effort}
              </Badge>
            </div>
            <p className="mt-1 text-ink-soft">{a.goal}</p>

            {/* The workflow as a flow: what starts it, what happens, what it achieves. */}
            <ol className="mt-5 flex flex-col">
              <FlowStep kind="trigger" label={t.trigger} text={a.trigger} />
              {a.steps.map((s, j) => (
                <FlowStep key={j} kind="step" label={t.step(j + 1)} text={s} />
              ))}
              <FlowStep kind="result" label={t.result} text={a.metric} last />
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
                <span className="font-semibold">{t.whereAiHelps} </span>
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

/* ---------- Score badge ---------- */

/**
 * For top scores only (70+): an embeddable badge that links back to the report, so a good result
 * becomes a reason for the company to show the tool on its own website.
 */
function ScoreBadge({ audit, reportId }: { audit: GrowthAuditResult; reportId: string }) {
  const { t } = useText();
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const badge = `${origin}/api/badge/${reportId}`;
  const code = `<a href="${origin}/r/${reportId}"><img src="${badge}" alt="${t.badgeAlt(audit.overallScore)}" width="236" height="56"></a>`;
  return (
    <section className="flex flex-col gap-5 rounded-2xl border-2 border-marker bg-white p-6 sm:flex-row sm:items-center sm:p-8 print:hidden">
      <div className="min-w-0 flex-1">
        <h2 className="text-xl font-bold tracking-tight">{t.badgeTitle(t.grade[audit.grade] ?? audit.grade)}</h2>
        <p className="mt-1 max-w-[52ch] text-sm leading-relaxed text-ink-soft">{t.badgeText}</p>
        {origin && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-mist px-3 py-2 text-xs text-ink-soft">{code}</code>
            <CopyButton
              text={code}
              label={t.copyCode}
              copiedLabel={t.codeCopied}
              className="shrink-0 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/85"
            />
          </div>
        )}
      </div>
      {origin && (
        // eslint-disable-next-line @next/next/no-img-element -- the badge exactly as other websites will show it
        <img src={badge} alt={t.badgeAlt(audit.overallScore)} width={236} height={56} className="shrink-0" />
      )}
    </section>
  );
}

/* ---------- Email lead form ---------- */

/**
 * An optional way to get in touch without LinkedIn: the email is stored for the owner (see /stats)
 * and the owner replies by hand. Nothing is sent automatically, so the copy promises a reply, not an email.
 */
function LeadForm({ domain, reportId }: { domain?: string; reportId: string }) {
  const { t } = useText();
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
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? t.somethingWrong);
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.somethingWrong);
      setState("idle");
    }
  }

  return (
    <section id="contact" className="scroll-mt-24 rounded-2xl bg-ink p-6 text-white sm:p-8 print:hidden">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t.leadTitle}</h2>
          <p className="mt-2 leading-relaxed text-white/75">{t.leadText(domain)}</p>
        </div>
        {state === "sent" ? (
          <p role="status" className="rounded-xl bg-white/10 p-5 font-medium">
            {t.leadThanks(domain)}
          </p>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label htmlFor="lead-email" className="sr-only">
                {t.yourEmail}
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
                {state === "sending" ? t.sending : t.sendFixes}
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
              {t.leadSmallPrint}{" "}
              <a href="/privacy" className="underline underline-offset-4 hover:text-white">
                {t.privacyPolicy}
              </a>
              {SITE.linkedinUrl && (
                <>
                  {" "}
                  {t.or}{" "}
                  <a href={SITE.linkedinUrl} target="_blank" rel="noreferrer" onClick={() => trackClick("cta_contact", reportId)} className="font-semibold text-white underline underline-offset-4 hover:text-marker">
                    {t.messageMeLower}
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
function Disclaimer({ domain, name, competitors = [] }: { domain: string; name: string; competitors?: string[] }) {
  const { t } = useText();
  return (
    <aside className="border-t border-ink/10 pt-6 text-xs leading-relaxed text-ink-soft">
      <p className="max-w-[80ch]">{t.disclaimer(domain, name, competitors)}</p>
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
  const { t } = useText();
  const label = t.status[status];
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
      {useText().t.messageMe}
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
