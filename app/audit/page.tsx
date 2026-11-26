"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CopyButton, Report } from "@/components/report";
import type { ProgressEvent, StepId } from "@/lib/events";
import type { SiteCheck } from "@/lib/reader/checks";
import type { WebsiteSummary } from "@/lib/reader/format";
import type { ReportData } from "@/lib/store/reports";
import { trackClick } from "@/lib/track-client";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { LangPicker } from "@/components/lang-picker";
import { parseLang, type Lang } from "@/lib/i18n";

type Status = "idle" | "running" | "done" | "error" | "skipped";

/** The steps as the visitor sees them, with a plain-language line about what each one does. */
const STEPS: { id: StepId; label: string; detail: string }[] = [
  { id: "read", label: "Reading the website", detail: "Homepage and up to four key pages, plus ten checks in code" },
  { id: "speed", label: "Measuring speed", detail: "Google PageSpeed tests the homepage on a mobile phone" },
  { id: "brandVoice", label: "Analysing the brand voice", detail: "Tone, audience and positioning, with quotes from the site" },
  { id: "audit", label: "Scoring the growth audit", detail: "Six areas scored, plus the quick wins" },
  { id: "automation", label: "Planning automations", detail: "The three workflows most worth automating" },
  { id: "contentPack", label: "Writing LinkedIn and X posts", detail: "Two ready-to-post posts in the brand's voice" },
  { id: "keywords", label: "Finding keywords", detail: "What the site targets, checked in code, plus five to add" },
];

const IDLE: Record<StepId, Status> = { speed: "idle", read: "idle", brandVoice: "idle", audit: "idle", automation: "idle", contentPack: "idle", keywords: "idle" };

export default function AuditPage() {
  const [url, setUrl] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [lang, setLang] = useState<Lang>("en");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Record<StepId, Status>>(IDLE);
  const [timing, setTiming] = useState<Partial<Record<StepId, number>>>({});
  const [stepNotes, setStepNotes] = useState<Partial<Record<StepId, string>>>({});
  const [results, setResults] = useState<ReportData>({});
  const [reportId, setReportId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);

  // Coming from the homepage form (/audit?url=…): fill in the address and start straight away.
  // The address is then removed from the browser bar, so reloading the page doesn't start another audit.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromHomepage = params.get("url");
    const langFromHomepage = parseLang(params.get("lang"));
    setLang(langFromHomepage);
    if (!fromHomepage) return;
    window.history.replaceState(null, "", "/audit");
    setUrl(fromHomepage);
    void startAudit(fromHomepage, langFromHomepage);
    // Runs once on page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function runAudit(e: React.FormEvent) {
    e.preventDefault();
    void startAudit(url, lang);
  }

  async function startAudit(url: string, lang: Lang) {
    setBusy(true);
    setError(null);
    setResults({ lang }); // so the report's labels appear in the chosen language from the first section
    setReportId(null);
    setTiming({});
    setStepNotes({});
    setStatus(IDLE);
    setTarget(url.trim().replace(/^https?:\/\//i, "").replace(/\/$/, ""));
    setStartedAt(Date.now());
    setFinishedAt(null);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, accessCode, lang }),
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
      setFinishedAt(Date.now());
    }
  }

  function handleEvent(event: ProgressEvent) {
    if (event.type === "step") {
      setStatus((s) => ({ ...s, [event.step]: event.status }));
      if (event.status === "error" || event.status === "skipped") setStepNotes((m) => ({ ...m, [event.step]: event.message }));
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
    } else if (event.type === "saved") {
      setReportId(event.id);
    } else if (event.type === "error") {
      if (event.step) setStatus((s) => ({ ...s, [event.step as StepId]: "error" }));
      setError(event.message);
    }
  }

  const shareUrl = reportId ? `${window.location.origin}/r/${reportId}` : null;

  return (
    <>
      <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 pb-20 pt-6">
        <header>
          <Link href="/" aria-label="Growth Audit AI, home" className="rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-marker">
            <Logo />
          </Link>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-ink">Audit a website</h1>
          <p className="mt-2 max-w-[62ch] leading-relaxed text-ink-soft">
            A scored audit, Google speed data, the brand voice, ready-to-post LinkedIn and X posts and an automation plan,
            built from the company&apos;s own public website. Takes about a minute.
          </p>
        </header>
  
        <form onSubmit={runAudit} className="flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="audit-url">
            Company website
          </label>
          <div className="flex flex-1 items-center rounded-lg border-2 border-ink bg-white focus-within:ring-4 focus-within:ring-marker">
            <span className="pl-4 text-ink-soft" aria-hidden="true">
              https://
            </span>
            <input
              id="audit-url"
              value={url.replace(/^https?:\/\//i, "")}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="company.com"
              required
              inputMode="url"
              className="w-full bg-transparent px-1 py-3 text-lg text-ink outline-none"
            />
          </div>
          <label className="sr-only" htmlFor="audit-code">
            Access code
          </label>
          <input
            id="audit-code"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            placeholder="Access code (optional)"
            type="password"
            className="rounded-lg border-2 border-ink/20 bg-white px-4 py-3 text-ink outline-none focus:border-ink sm:w-52"
          />
          <button
            disabled={busy}
            className="rounded-lg bg-ink px-6 py-3 text-lg font-semibold text-white hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-marker disabled:opacity-60"
          >
            {busy ? "Running…" : "Run audit"}
          </button>
        </form>
        <div className="-mt-6">
          <LangPicker value={lang} onChange={setLang} />
        </div>
  
        {startedAt && (
          <Progress
            target={target}
            status={status}
            timing={timing}
            notes={stepNotes}
            busy={busy}
            startedAt={startedAt}
            finishedAt={finishedAt}
            failed={Boolean(error)}
            shareUrl={shareUrl}
            reportId={reportId}
          />
        )}
  
        {error && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
  
        <Report data={results} shareUrl={shareUrl} reportId={reportId} />
      </main>
      <SiteFooter />
    </>
  );
}

/* ---------- The progress card ---------- */

function Progress({
  target,
  status,
  timing,
  notes,
  busy,
  startedAt,
  finishedAt,
  failed,
  shareUrl,
  reportId,
}: {
  target: string | null;
  status: Record<StepId, Status>;
  timing: Partial<Record<StepId, number>>;
  notes: Partial<Record<StepId, string>>;
  busy: boolean;
  startedAt: number;
  finishedAt: number | null;
  failed: boolean;
  shareUrl: string | null;
  reportId: string | null;
}) {
  const [now, setNow] = useState(Date.now());
  const [showSteps, setShowSteps] = useState(false);

  // A live timer while the audit runs.
  useEffect(() => {
    if (!busy) return;
    const tick = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(tick);
  }, [busy]);

  const finished = STEPS.filter((s) => ["done", "error", "skipped"].includes(status[s.id])).length;
  const seconds = Math.max(0, Math.round(((finishedAt ?? now) - startedAt) / 1000));
  const complete = !busy && !failed && finished === STEPS.length;
  const open = busy || failed || showSteps;

  return (
    <section aria-live="polite" className="rounded-2xl border border-ink/10 bg-white p-5 text-ink sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {complete ? <Icon status="complete" large /> : busy ? <Icon status="running" large /> : <Icon status="error" large />}
          <div>
            <p className="font-semibold">
              {complete
                ? `Audit complete in ${seconds} seconds`
                : busy
                  ? `Auditing ${target ?? "the website"}`
                  : "The audit stopped"}
            </p>
            <p className="text-sm text-ink-soft">
              {complete ? (shareUrl ? "Your report is saved and has its own link." : "Your report is below.") : `${finished} of ${STEPS.length} steps, ${seconds}s`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {complete && shareUrl && (
            <CopyButton
              text={shareUrl}
              label="Copy report link"
              copiedLabel="Link copied"
              onCopy={() => trackClick("link_copy", reportId)}
              className="rounded-lg bg-ink px-3.5 py-2 text-sm font-semibold text-white hover:bg-ink/85"
            />
          )}
          {complete && (
            <button
              type="button"
              onClick={() => setShowSteps((v) => !v)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-mist hover:text-ink"
              aria-expanded={showSteps}
            >
              {showSteps ? "Hide steps" : "Show steps"}
            </button>
          )}
        </div>
      </div>

      {/* Overall progress */}
      {/* The logo's yellow fills the bar as the steps finish. */}
      <div className="mt-5 h-4 overflow-hidden rounded-full bg-mist" role="progressbar" aria-valuemin={0} aria-valuemax={STEPS.length} aria-valuenow={finished}>
        {(() => {
          const share = Math.max(finished / STEPS.length, busy ? 0.04 : 0);
          return (
            <div
              className={`h-full rounded-full transition-[width] duration-700 ease-out ${failed ? "bg-red-500" : ""}`}
              style={{
                width: `${share * 100}%`,
                ...(failed || share === 0
                  ? {}
                  : { backgroundColor: "#ffe15a" }),
              }}
            />
          );
        })()}
      </div>

      {open && (
        <ol className="mt-5 flex flex-col">
          {STEPS.map((step, i) => {
            const s = status[step.id];
            return (
              <li key={step.id} className="relative flex gap-3 pb-4 last:pb-0">
                {i < STEPS.length - 1 && <span aria-hidden="true" className="absolute left-[11px] top-7 h-[calc(100%-1.75rem)] w-px bg-ink/10" />}
                <Icon status={s} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className={`font-medium ${s === "idle" ? "text-ink-soft" : ""}`}>{step.label}</p>
                    <span className="shrink-0 text-sm tabular-nums text-ink-soft">
                      {timing[step.id] !== undefined ? `${(timing[step.id]! / 1000).toFixed(1)}s` : s === "running" ? "running" : ""}
                    </span>
                  </div>
                  <p className={`text-sm ${s === "error" ? "text-red-700" : "text-ink-soft"}`}>{notes[step.id] ?? step.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function Icon({ status: given, large = false }: { status: Status | "complete"; large?: boolean }) {
  // "complete" is the big tick on the finished card, in the logo's colours (yellow, ink tick) to match the bar.
  const status: Status = given === "complete" ? "done" : given;
  const size = large ? "h-9 w-9" : "h-6 w-6";
  if (status === "running") {
    return (
      <span className={`relative flex ${size} shrink-0 items-center justify-center`} aria-label="Running" role="img">
        <span className={`${large ? "h-7 w-7 border-[3px]" : "h-5 w-5 border-2"} animate-spin rounded-full border-mist border-t-ink motion-reduce:animate-none`} />
      </span>
    );
  }
  const style = {
    idle: "border-2 border-ink/15 bg-white",
    done: given === "complete" ? "bg-marker text-ink" : "bg-emerald-500 text-white",
    error: "bg-red-500 text-white",
    skipped: "bg-mist text-ink-soft",
  }[status];
  const label = { idle: "Waiting", done: "Done", error: "Failed", skipped: "Skipped" }[status];
  return (
    <span className={`flex ${size} shrink-0 items-center justify-center rounded-full ${style}`} aria-label={label} role="img">
      {status === "done" && (
        <svg viewBox="0 0 24 24" className={large ? "h-5 w-5" : "h-3.5 w-3.5"} fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {status === "error" && <span className={`font-bold ${large ? "text-lg" : "text-xs"}`}>!</span>}
      {status === "skipped" && <span className="text-xs font-bold">–</span>}
    </span>
  );
}
