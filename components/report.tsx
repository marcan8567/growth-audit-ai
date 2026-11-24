"use client";

import { useState } from "react";
import type { SiteCheck } from "@/lib/reader/checks";
import type { WebsiteSummary } from "@/lib/reader/format";
import type { PageSpeedResult } from "@/lib/reader/pagespeed";
import type { AutomationPlan } from "@/lib/schemas/automation-plan";
import type { ContentPack } from "@/lib/schemas/content-pack";
import type { BrandVoiceResult } from "@/lib/steps/brand-voice";
import type { GrowthAuditResult } from "@/lib/steps/growth-audit";
import { SITE } from "@/lib/site";
import type { ReportData } from "@/lib/store/reports";

/**
 * The full report. Used by the live audit page (sections appear as steps finish)
 * and by the saved-report page /r/[id] (everything at once).
 */
export function Report({ data, showRawData = false }: { data: ReportData; showRawData?: boolean }) {
  const { site, checks, speed, brandVoice, audit, automation, contentPack } = data;
  return (
    <>
      {audit && site && <Overview audit={audit} domain={site.domain} />}
      {checks && site && <Checks checks={checks} site={site} />}
      {speed && <Speed speed={speed} />}
      {audit && <Scores audit={audit} />}
      {brandVoice && <BrandVoice voice={brandVoice} />}
      {contentPack && <Content pack={contentPack} domain={site?.domain} />}
      {automation && <Automations plan={automation} />}

      {showRawData && Object.keys(data).length > 0 && (
        <Section title="Raw data" subtitle="The exact JSON each step returned, for checking and debugging.">
          {Object.entries(data).map(([key, value]) => (
            <JsonBlock key={key} label={key} value={value} />
          ))}
        </Section>
      )}
    </>
  );
}

/* ---------- Report sections ---------- */

function Overview({ audit, domain }: { audit: GrowthAuditResult; domain: string }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-stone-200 bg-white p-6 sm:flex-row sm:items-center sm:gap-8">
      <div className="flex shrink-0 flex-col items-center">
        <span className={`text-5xl font-semibold ${scoreColor(audit.overallScore / 10)}`}>{audit.overallScore}</span>
        <span className="text-sm text-stone-500">/ 100 · {audit.grade}</span>
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">{domain}</h2>
        <p className="text-stone-700">{audit.summary}</p>
        <p className="text-stone-700">
          <span className="font-medium">Biggest opportunity: </span>
          {audit.biggestOpportunity}
        </p>
      </div>
    </section>
  );
}

function Checks({ checks, site }: { checks: SiteCheck[]; site: WebsiteSummary }) {
  const icon = { pass: "✓", warn: "!", fail: "✕" };
  const color = { pass: "text-emerald-700", warn: "text-amber-600", fail: "text-red-600" };
  return (
    <Section
      title="Website checks"
      subtitle={`Measured by code, no AI. ${site.pages.length} page${site.pages.length === 1 ? "" : "s"} read${
        site.failedPages.length ? `, ${site.failedPages.length} failed` : ""
      }: ${site.pages.map((p) => p.kind).join(", ")}.`}
    >
      <ul className="grid gap-2 sm:grid-cols-2">
        {checks.map((c) => (
          <li key={c.id} className="flex gap-3 rounded-lg border border-stone-200 bg-white p-3 text-sm">
            <span className={`font-bold ${color[c.status]}`}>{icon[c.status]}</span>
            <span>
              <span className="font-medium">{c.label}</span>
              <span className="block text-stone-600">{c.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Speed({ speed }: { speed: PageSpeedResult }) {
  const scores: { label: string; value: number | null }[] = [
    { label: "Performance", value: speed.scores.performance },
    { label: "SEO", value: speed.scores.seo },
    { label: "Accessibility", value: speed.scores.accessibility },
    { label: "Best practices", value: speed.scores.bestPractices },
  ];
  const icon = { pass: "✓", warn: "!", fail: "✕" };
  const color = { pass: "text-emerald-700", warn: "text-amber-600", fail: "text-red-600" };
  return (
    <Section
      title="Speed and mobile"
      subtitle={`Measured by Google PageSpeed Insights on a simulated mobile phone${
        speed.field ? `, plus real Chrome users over the last 28 days${speed.field.wholeSite ? " (whole website)" : ""}` : ""
      }. No AI.`}
    >
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {scores.map((s) => (
          <li key={s.label} className="flex flex-col items-center rounded-lg border border-stone-200 bg-white p-3">
            <span className={`text-3xl font-semibold ${s.value === null ? "text-stone-300" : scoreColor(s.value / 10)}`}>
              {s.value ?? "–"}
            </span>
            <span className="text-xs text-stone-500">{s.label}</span>
          </li>
        ))}
      </ul>
      {speed.checks.length > 0 && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {speed.checks
            .filter((c) => c.id !== "speed-score" && c.id !== "lighthouse-seo")
            .map((c) => (
              <li key={c.id} className="flex gap-3 rounded-lg border border-stone-200 bg-white p-3 text-sm">
                <span className={`font-bold ${color[c.status]}`}>{icon[c.status]}</span>
                <span>
                  <span className="font-medium">{c.label}</span>
                  <span className="block text-stone-600">{c.detail}</span>
                </span>
              </li>
            ))}
        </ul>
      )}
    </Section>
  );
}

function Scores({ audit }: { audit: GrowthAuditResult }) {
  return (
    <Section
      title="Growth audit"
      subtitle={`The AI scores each area; the overall score is calculated by code. Grounding check: ${audit.grounding.verifiedQuotes} of ${audit.grounding.totalQuotes} quotes found word for word on the website.`}
    >
      <ul className="flex flex-col gap-3">
        {audit.categories.map((c) => (
          <li key={c.id} className="rounded-lg border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium">{c.label}</span>
              <span className={`font-semibold ${scoreColor(c.score)}`}>{c.score}/10</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-stone-100">
              <div className={`h-2 rounded-full ${barColor(c.score)}`} style={{ width: `${c.score * 10}%` }} />
            </div>
            <p className="mt-2 text-sm text-stone-700">{c.verdict}</p>
            <details className="mt-2 text-sm">
              <summary className="cursor-pointer text-stone-500">Details</summary>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <List title="Strengths" items={c.strengths} />
                <List title="Issues" items={c.issues} />
              </div>
              {c.evidence.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1">
                  {c.evidence.map((e, i) => (
                    <li key={i} className="text-stone-600">
                      <span className={e.verified ? "text-emerald-700" : "text-amber-600"}>
                        {e.verified ? "✓ verified" : "! not found on site"}
                      </span>{" "}
                      “{e.quote}”
                    </li>
                  ))}
                </ul>
              )}
            </details>
          </li>
        ))}
      </ul>

      <h3 className="mt-4 text-lg font-semibold">Quick wins</h3>
      <ol className="flex flex-col gap-3">
        {audit.quickWins.map((w, i) => (
          <li key={i} className="rounded-lg border border-stone-200 bg-white p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">
                {i + 1}. {w.title}
              </span>
              <Badge>Impact: {w.impact}</Badge>
              <Badge>Effort: {w.effort}</Badge>
            </div>
            <p className="mt-1 text-stone-700">{w.action}</p>
            <p className="mt-1 text-stone-500">{w.why}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function BrandVoice({ voice }: { voice: BrandVoiceResult }) {
  const p = voice.profile;
  return (
    <Section
      title="Brand voice"
      subtitle={`Grounding check: ${voice.grounding.verifiedQuotes} of ${voice.grounding.totalQuotes} quotes found word for word on the website.`}
    >
      <div className="flex flex-wrap gap-2">
        {p.tone.map((t) => (
          <span key={t} className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-900">
            {t}
          </span>
        ))}
      </div>
      <p className="text-stone-700">{p.toneSummary}</p>
      <p className="text-stone-700">
        <span className="font-medium">Positioning: </span>
        {p.positioning}
      </p>
      <p className="text-stone-700">
        <span className="font-medium">Audience: </span>
        {p.audience.primary}
        {p.audience.secondary ? ` Also: ${p.audience.secondary}` : ""}
      </p>
      <div className="grid gap-3 text-sm sm:grid-cols-3">
        <List title="Key messages" items={p.keyMessages} />
        <List title="Words they use" items={p.wordsTheyUse} />
        <List title="Words to avoid" items={p.wordsToAvoid} />
      </div>
    </Section>
  );
}

function Content({ pack, domain }: { pack: ContentPack; domain?: string }) {
  // Older saved reports have 14 posts; every report now shows one, and the full plan is offered on LinkedIn.
  const post = pack.posts[0];
  if (!post) return null;
  return (
    <Section title="Social media post" subtitle="One ready-to-post suggestion in the brand's voice, for the channel that suits the company best.">
      <article className="rounded-lg border border-stone-200 bg-white p-5 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{post.platform}</Badge>
          <Badge>{post.format}</Badge>
          <span className="text-stone-400">{post.pillar}</span>
        </div>
        <p className="mt-3 text-base font-semibold">{post.hook}</p>
        <p className="mt-2 whitespace-pre-line leading-relaxed text-stone-700">{post.body}</p>
        <p className="mt-3 text-stone-600">
          <span className="font-medium">Call to action: </span>
          {post.cta}
        </p>
        {post.hashtags.length > 0 && (
          <p className="mt-1 text-emerald-700">{post.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}</p>
        )}
        <CopyButton text={`${post.hook}

${post.body}

${post.cta}`} label="Copy post" />
      </article>

      {SITE.linkedinUrl && (
        <div className="rounded-xl bg-ink p-6 text-white">
          <h3 className="text-lg font-semibold">Want a full content plan{domain ? ` for ${domain}` : ""}?</h3>
          <p className="mt-2 max-w-[60ch] leading-relaxed text-white/80">
            Two weeks of posts like this one, built on the three themes that suit the company best:{" "}
            {pack.pillars.map((p) => p.name).join(", ")}. Send me a message and I&apos;ll put it together.
          </p>
          <a
            href={SITE.linkedinUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block rounded-lg bg-white px-5 py-2.5 font-semibold text-ink hover:bg-marker focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-marker"
          >
            Message me on LinkedIn
          </a>
        </div>
      )}
    </Section>
  );
}

function Automations({ plan }: { plan: AutomationPlan }) {
  return (
    <Section title="Automation plan" subtitle={plan.summary}>
      <ol className="flex flex-col gap-3">
        {plan.automations.map((a, i) => (
          <li key={i} className="rounded-lg border border-stone-200 bg-white p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">
                {i + 1}. {a.name}
              </span>
              <Badge>Impact: {a.impact}</Badge>
              <Badge>Effort: {a.effort}</Badge>
            </div>
            <p className="mt-1 text-stone-700">{a.goal}</p>
            <p className="mt-2 text-stone-600">
              <span className="font-medium">Trigger: </span>
              {a.trigger}
            </p>
            <ol className="mt-1 list-decimal pl-5 text-stone-700">
              {a.steps.map((s, j) => (
                <li key={j}>{s}</li>
              ))}
            </ol>
            <p className="mt-2 text-stone-600">
              <span className="font-medium">Tools: </span>
              {a.tools.join(", ")}
            </p>
            {a.aiRole && (
              <p className="text-stone-600">
                <span className="font-medium">Role of AI: </span>
                {a.aiRole}
              </p>
            )}
            <p className="text-stone-600">
              <span className="font-medium">Measure: </span>
              {a.metric}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ---------- Small building blocks ---------- */

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {subtitle && <p className="text-sm text-stone-600">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="font-medium">{title}</p>
      <ul className="list-disc pl-5 text-stone-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-700">{children}</span>;
}

export function CopyButton({ text, label, className }: { text: string; label: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className={className ?? "mt-2 text-xs font-medium text-stone-500 hover:text-stone-900"}
    >
      {copied ? "Copied" : label}
    </button>
  );
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <details className="rounded-lg border border-stone-200 bg-white">
      <summary className="cursor-pointer px-4 py-2 text-sm font-medium">{label}</summary>
      <pre className="max-h-[32rem] overflow-auto border-t border-stone-200 p-4 text-xs leading-relaxed">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}

const scoreColor = (score10: number) =>
  score10 >= 7 ? "text-emerald-700" : score10 >= 4.5 ? "text-amber-600" : "text-red-600";
const barColor = (score10: number) => (score10 >= 7 ? "bg-emerald-500" : score10 >= 4.5 ? "bg-amber-400" : "bg-red-500");
