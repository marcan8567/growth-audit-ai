"use client";

import { useState } from "react";
import type { ProgressEvent, StepId } from "@/lib/events";
import type { SiteCheck } from "@/lib/reader/checks";
import type { WebsiteSummary } from "@/lib/reader/format";
import type { AutomationPlan } from "@/lib/schemas/automation-plan";
import type { ContentPack } from "@/lib/schemas/content-pack";
import type { BrandVoiceResult } from "@/lib/steps/brand-voice";
import type { GrowthAuditResult } from "@/lib/steps/growth-audit";

type Status = "idle" | "running" | "done" | "error";

const STEPS: { id: StepId; label: string }[] = [
  { id: "read", label: "Reading the website and running checks" },
  { id: "brandVoice", label: "Analysing the brand voice" },
  { id: "audit", label: "Scoring the growth audit" },
  { id: "automation", label: "Planning automations" },
  { id: "contentPack", label: "Writing the 14-day content pack" },
];

const IDLE: Record<StepId, Status> = { read: "idle", brandVoice: "idle", audit: "idle", automation: "idle", contentPack: "idle" };

interface Results {
  site?: WebsiteSummary;
  checks?: SiteCheck[];
  brandVoice?: BrandVoiceResult;
  audit?: GrowthAuditResult;
  automation?: AutomationPlan;
  contentPack?: ContentPack;
}

export default function AuditPage() {
  const [url, setUrl] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Record<StepId, Status>>(IDLE);
  const [timing, setTiming] = useState<Partial<Record<StepId, number>>>({});
  const [stepErrors, setStepErrors] = useState<Partial<Record<StepId, string>>>({});
  const [results, setResults] = useState<Results>({});
  const [error, setError] = useState<string | null>(null);

  async function runAudit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResults({});
    setTiming({});
    setStepErrors({});
    setStatus(IDLE);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, accessCode }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed (HTTP ${res.status}).`);
      }

      // Read the stream line by line; each line is one progress event.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) if (line.trim()) handleEvent(JSON.parse(line) as ProgressEvent);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function handleEvent(event: ProgressEvent) {
    if (event.type === "step") {
      setStatus((s) => ({ ...s, [event.step]: event.status }));
      if (event.status === "error") setStepErrors((m) => ({ ...m, [event.step]: event.message }));
      if (event.status === "done") {
        setTiming((t) => ({ ...t, [event.step]: event.ms }));
        setResults((r) => {
          if (event.step === "read") {
            const d = event.data as { site: WebsiteSummary; checks: SiteCheck[] };
            return { ...r, site: d.site, checks: d.checks };
          }
          return { ...r, [event.step]: event.data };
        });
      }
    } else if (event.type === "error") {
      if (event.step) setStatus((s) => ({ ...s, [event.step as StepId]: "error" }));
      setError(event.message);
    }
  }

  const { site, checks, brandVoice, audit, automation, contentPack } = results;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-12">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">Growth Audit AI</p>
        <h1 className="mt-1 text-3xl font-semibold">Any company URL in, a growth audit out</h1>
        <p className="mt-2 text-stone-600">
          Brand voice, a scored audit, a 14-day content pack and an automation plan, built from the company&apos;s own
          public website. Takes about a minute.
        </p>
      </header>

      <form onSubmit={runAudit} className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-5 sm:flex-row">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="company.com"
          required
          className="flex-1 rounded-lg border border-stone-300 px-4 py-2.5 outline-none focus:border-stone-900"
        />
        <input
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          placeholder="Access code"
          type="password"
          className="rounded-lg border border-stone-300 px-4 py-2.5 outline-none focus:border-stone-900 sm:w-40"
        />
        <button
          disabled={busy}
          className="rounded-lg bg-stone-900 px-5 py-2.5 font-medium text-white hover:bg-stone-700 disabled:opacity-50"
        >
          {busy ? "Running…" : "Run audit"}
        </button>
      </form>

      {/* Live progress */}
      <ol className="flex flex-col gap-2">
        {STEPS.map((step, i) => (
          <li key={step.id} className="flex flex-col text-sm">
            <span className="flex items-center gap-3">
              <StatusDot status={status[step.id]} />
              <span className={status[step.id] === "idle" ? "text-stone-400" : ""}>
                {i + 1}. {step.label}
              </span>
              {timing[step.id] !== undefined && (
                <span className="text-stone-400">{(timing[step.id]! / 1000).toFixed(1)}s</span>
              )}
            </span>
            {stepErrors[step.id] && <span className="ml-6 text-red-700">{stepErrors[step.id]}</span>}
          </li>
        ))}
      </ol>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}

      {audit && site && <Overview audit={audit} domain={site.domain} />}
      {checks && site && <Checks checks={checks} site={site} />}
      {audit && <Scores audit={audit} />}
      {brandVoice && <BrandVoice voice={brandVoice} />}
      {contentPack && <Content pack={contentPack} />}
      {automation && <Automations plan={automation} />}

      {Object.keys(results).length > 0 && (
        <Section title="Raw data" subtitle="The exact JSON each step returned, for checking and debugging.">
          {Object.entries(results).map(([key, value]) => (
            <JsonBlock key={key} label={key} value={value} />
          ))}
        </Section>
      )}
    </main>
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

function Content({ pack }: { pack: ContentPack }) {
  return (
    <Section title="14-day content pack" subtitle={pack.strategy}>
      <ul className="grid gap-2 sm:grid-cols-3">
        {pack.pillars.map((p) => (
          <li key={p.name} className="rounded-lg border border-stone-200 bg-white p-3 text-sm">
            <span className="font-medium">{p.name}</span>
            <span className="block text-stone-600">{p.why}</span>
          </li>
        ))}
      </ul>
      <ol className="flex flex-col gap-3">
        {pack.posts.map((post) => (
          <li key={post.day} className="rounded-lg border border-stone-200 bg-white p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">Day {post.day}</span>
              <Badge>{post.platform}</Badge>
              <Badge>{post.format}</Badge>
              <span className="text-stone-400">{post.pillar}</span>
            </div>
            <p className="mt-2 font-medium">{post.hook}</p>
            <p className="mt-1 whitespace-pre-line text-stone-700">{post.body}</p>
            <p className="mt-2 text-stone-600">
              <span className="font-medium">CTA: </span>
              {post.cta}
            </p>
            {post.hashtags.length > 0 && (
              <p className="mt-1 text-emerald-700">{post.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}</p>
            )}
            <CopyButton text={`${post.hook}\n\n${post.body}\n\n${post.cta}`} />
          </li>
        ))}
      </ol>
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

function CopyButton({ text }: { text: string }) {
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
      className="mt-2 text-xs font-medium text-stone-500 hover:text-stone-900"
    >
      {copied ? "Copied" : "Copy post"}
    </button>
  );
}

function StatusDot({ status }: { status: Status }) {
  const style = {
    idle: "bg-stone-200",
    running: "animate-pulse bg-amber-400",
    done: "bg-emerald-500",
    error: "bg-red-500",
  }[status];
  return <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${style}`} />;
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
