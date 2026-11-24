"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CopyButton, Report } from "@/components/report";
import type { ProgressEvent, StepId } from "@/lib/events";
import type { SiteCheck } from "@/lib/reader/checks";
import type { WebsiteSummary } from "@/lib/reader/format";
import type { ReportData } from "@/lib/store/reports";

type Status = "idle" | "running" | "done" | "error" | "skipped";

const STEPS: { id: StepId; label: string }[] = [
  { id: "read", label: "Reading the website and running checks" },
  { id: "speed", label: "Measuring speed with Google PageSpeed" },
  { id: "brandVoice", label: "Analysing the brand voice" },
  { id: "audit", label: "Scoring the growth audit" },
  { id: "automation", label: "Planning automations" },
  { id: "contentPack", label: "Writing LinkedIn and X posts" },
];

const IDLE: Record<StepId, Status> = { speed: "idle", read: "idle", brandVoice: "idle", audit: "idle", automation: "idle", contentPack: "idle" };

export default function AuditPage() {
  const [url, setUrl] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Record<StepId, Status>>(IDLE);
  const [timing, setTiming] = useState<Partial<Record<StepId, number>>>({});
  const [stepErrors, setStepErrors] = useState<Partial<Record<StepId, string>>>({});
  const [results, setResults] = useState<ReportData>({});
  const [reportId, setReportId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Coming from the homepage form (/audit?url=…): fill in the address and start straight away.
  // The address is then removed from the browser bar, so reloading the page doesn't start another audit.
  useEffect(() => {
    const fromHomepage = new URLSearchParams(window.location.search).get("url");
    if (!fromHomepage) return;
    window.history.replaceState(null, "", "/audit");
    setUrl(fromHomepage);
    void startAudit(fromHomepage);
    // Runs once on page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function runAudit(e: React.FormEvent) {
    e.preventDefault();
    void startAudit(url);
  }

  async function startAudit(url: string) {
    setBusy(true);
    setError(null);
    setResults({});
    setReportId(null);
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
      if (event.status === "error" || event.status === "skipped") setStepErrors((m) => ({ ...m, [event.step]: event.message }));
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
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-12">
      <header>
        <Link href="/" className="text-lg font-bold tracking-tight text-ink hover:underline">
            Growth Audit AI
          </Link>
        <h1 className="mt-1 text-3xl font-semibold">Any company URL in, a growth audit out</h1>
        <p className="mt-2 text-stone-600">
          A scored audit, Google speed data, the brand voice, ready-to-post LinkedIn and X posts and an automation plan,
          built from the company&apos;s own public website. Takes about a minute.
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
          placeholder="Access code (optional)"
          type="password"
          className="rounded-lg border border-stone-300 px-4 py-2.5 outline-none focus:border-stone-900 sm:w-48"
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
            {stepErrors[step.id] && (
              <span className={`ml-6 ${status[step.id] === "skipped" ? "text-stone-400" : "text-red-700"}`}>{stepErrors[step.id]}</span>
            )}
          </li>
        ))}
      </ol>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}

      {shareUrl && (
        <div className="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm sm:flex-row sm:items-center">
          <span className="font-medium text-emerald-900">Report saved.</span>
          <a href={shareUrl} target="_blank" rel="noreferrer" className="truncate text-emerald-800 underline">
            {shareUrl}
          </a>
          <CopyButton
            text={shareUrl}
            label="Copy link"
            className="shrink-0 rounded-lg bg-emerald-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 sm:ml-auto"
          />
        </div>
      )}

      <Report data={results} showRawData />
    </main>
  );
}

function StatusDot({ status }: { status: Status }) {
  const style = {
    idle: "bg-stone-200",
    running: "animate-pulse bg-amber-400",
    done: "bg-emerald-500",
    error: "bg-red-500",
    skipped: "bg-stone-300",
  }[status];
  return <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${style}`} />;
}
