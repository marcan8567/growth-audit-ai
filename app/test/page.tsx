"use client";

import { useState } from "react";
import type { ProgressEvent, StepId } from "@/lib/events";
import type { WebsiteSummary } from "@/lib/reader/format";
import type { BrandVoiceResult } from "@/lib/steps/brand-voice";

type Status = "idle" | "running" | "done" | "error";

const STEPS: { id: StepId; label: string }[] = [
  { id: "read", label: "Reading the website" },
  { id: "brandVoice", label: "Analysing the brand voice" },
];

export default function TestPage() {
  const [url, setUrl] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Record<StepId, Status>>({ read: "idle", brandVoice: "idle" });
  const [timing, setTiming] = useState<Partial<Record<StepId, number>>>({});
  const [site, setSite] = useState<WebsiteSummary | null>(null);
  const [voice, setVoice] = useState<BrandVoiceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAudit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSite(null);
    setVoice(null);
    setTiming({});
    setStatus({ read: "idle", brandVoice: "idle" });

    try {
      const res = await fetch("/api/brand-voice-test", {
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
      if (event.status === "done") {
        setTiming((t) => ({ ...t, [event.step]: event.ms }));
        if (event.step === "read") setSite(event.data as WebsiteSummary);
        if (event.step === "brandVoice") setVoice(event.data as BrandVoiceResult);
      }
    } else if (event.type === "error") {
      if (event.step) setStatus((s) => ({ ...s, [event.step as StepId]: "error" }));
      setError(event.message);
    }
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">Test page · Milestone 2</p>
        <h1 className="mt-1 text-3xl font-semibold">Website reader + brand voice</h1>
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
          {busy ? "Running…" : "Run"}
        </button>
      </form>

      <ol className="flex flex-col gap-2">
        {STEPS.map((step, i) => (
          <li key={step.id} className="flex items-center gap-3 text-sm">
            <StatusDot status={status[step.id]} />
            <span className={status[step.id] === "idle" ? "text-stone-400" : ""}>
              {i + 1}. {step.label}
            </span>
            {timing[step.id] !== undefined && (
              <span className="text-stone-400">{(timing[step.id]! / 1000).toFixed(1)}s</span>
            )}
          </li>
        ))}
      </ol>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}

      {site && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Website read</h2>
          <p className="text-sm text-stone-600">
            {site.pages.length} page{site.pages.length === 1 ? "" : "s"} read
            {site.failedPages.length ? `, ${site.failedPages.length} failed` : ""} ·{" "}
            {site.socialLinks.map((s) => s.platform).join(", ") || "no social links found"}
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {site.pages.map((p) => (
              <li key={p.url} className="rounded-lg border border-stone-200 bg-white p-3 text-sm">
                <span className="font-medium capitalize">{p.kind}</span>
                <span className="text-stone-400"> · {p.wordCount} words</span>
                <p className="truncate text-stone-600">{p.title || p.url}</p>
              </li>
            ))}
          </ul>
          <JsonBlock label="Website summary JSON" value={site} />
        </section>
      )}

      {voice && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Brand voice</h2>
          <div className="flex flex-wrap gap-2">
            {voice.profile.tone.map((t) => (
              <span key={t} className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-900">
                {t}
              </span>
            ))}
          </div>
          <p className="text-stone-700">{voice.profile.positioning}</p>
          <p className="text-sm text-stone-600">
            Grounding check: {voice.grounding.verifiedQuotes} of {voice.grounding.totalQuotes} quotes found word for
            word on the website.
          </p>
          <JsonBlock label="Brand voice JSON" value={voice} open />
        </section>
      )}
    </main>
  );
}

function StatusDot({ status }: { status: Status }) {
  const style = {
    idle: "bg-stone-200",
    running: "animate-pulse bg-amber-400",
    done: "bg-emerald-500",
    error: "bg-red-500",
  }[status];
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${style}`} />;
}

function JsonBlock({ label, value, open = false }: { label: string; value: unknown; open?: boolean }) {
  return (
    <details open={open} className="rounded-lg border border-stone-200 bg-white">
      <summary className="cursor-pointer px-4 py-2 text-sm font-medium">{label}</summary>
      <pre className="max-h-[32rem] overflow-auto border-t border-stone-200 p-4 text-xs leading-relaxed">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}
