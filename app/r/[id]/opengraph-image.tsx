import { ImageResponse } from "next/og";
import { ogFonts } from "@/lib/og-font";
import { loadReport } from "@/lib/store/reports";

/**
 * The preview card shown when a report link is shared (LinkedIn, Slack, WhatsApp, X…):
 * company, score ring, grade and the biggest opportunity, in the site's colours.
 */

export const runtime = "nodejs";
export const alt = "Growth audit score";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#172033";
const MIST = "#eef1f5";
const MARKER = "#ffe15a";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const [report, fonts] = await Promise.all([loadReport((await params).id).catch(() => null), ogFonts()]);
  const domain = report?.site?.domain ?? "Website";
  const name = report?.site?.brand?.name ?? domain;
  const score = report?.audit?.overallScore ?? null;
  const grade = report?.audit?.grade ?? "";
  const opportunity = trim(report?.audit?.biggestOpportunity ?? "", 150);
  const ring = score === null ? "#cbd2dc" : score >= 70 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444";

  const r = 110;
  const circumference = 2 * Math.PI * r;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#ffffff", padding: 64, color: INK, fontFamily: "Schibsted Grotesk" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>Growth Audit AI</div>
          <div style={{ display: "flex", fontSize: 24, color: "#4a5468" }}>Growth audit</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 64, marginTop: 56, flex: 1 }}>
          <div style={{ display: "flex", position: "relative", width: 260, height: 260 }}>
            <svg width="260" height="260" viewBox="0 0 260 260">
              <circle cx="130" cy="130" r={r} fill="none" stroke={MIST} strokeWidth="22" />
              <circle
                cx="130"
                cy="130"
                r={r}
                fill="none"
                stroke={ring}
                strokeWidth="22"
                strokeLinecap="round"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={`${circumference * (1 - (score ?? 0) / 100)}`}
                transform="rotate(-90 130 130)"
              />
            </svg>
            <div style={{ position: "absolute", top: 0, left: 0, width: 260, height: 260, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ display: "flex", fontSize: 96, fontWeight: 700, lineHeight: 1 }}>{score ?? "–"}</div>
              <div style={{ display: "flex", fontSize: 24, color: "#4a5468" }}>out of 100</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ display: "flex", fontSize: 64, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1.5 }}>{trim(name, 28)}</div>
            <div style={{ display: "flex", fontSize: 28, color: "#4a5468", marginTop: 8 }}>{grade ? `${domain}: ${grade}` : domain}</div>
            {opportunity && (
              <div style={{ display: "flex", flexDirection: "column", marginTop: 32 }}>
                <div style={{ display: "flex", fontSize: 22, fontWeight: 700 }}>Biggest opportunity</div>
                <div style={{ display: "flex", fontSize: 28, lineHeight: 1.35, marginTop: 8, background: MARKER, padding: "4px 10px", borderRadius: 6 }}>
                  {opportunity}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}

/** Shortens text at a word boundary, adding an ellipsis. */
function trim(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[s,;:.-]+$/, "")}…`;
}
