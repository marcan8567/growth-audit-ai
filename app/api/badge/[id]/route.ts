import { RING } from "@/components/logo";
import { BADGE_MIN_SCORE } from "@/lib/badge";
import { loadReport } from "@/lib/store/reports";

export const runtime = "nodejs";


const LABEL = { en: "Growth score", es: "Puntuación", de: "Wachstums-Score" } as const;
const GRADE: Record<string, Record<"en" | "es" | "de", string>> = {
  Strong: { en: "Strong", es: "Sólido", de: "Stark" },
  Excellent: { en: "Excellent", es: "Excelente", de: "Hervorragend" },
};

/**
 * GET /api/badge/<reportId> → an SVG badge ("Growth score 82/100 · Strong") for websites to embed.
 * Exists only for reports that scored 70 or more. Plain shapes and text, no scripts, cached for a day.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const report = await loadReport((await params).id).catch(() => null);
  const audit = report?.audit;
  if (!audit || audit.overallScore < BADGE_MIN_SCORE) return new Response(null, { status: 404 });

  const lang = report.lang ?? "en";
  const label = LABEL[lang];
  const grade = GRADE[audit.grade]?.[lang] ?? audit.grade;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="236" height="56" viewBox="0 0 236 56" role="img" aria-label="${label} ${audit.overallScore}/100, ${grade}">
  <title>${label} ${audit.overallScore}/100 · Growth Audit AI</title>
  <rect width="236" height="56" rx="12" fill="#172033"/>
  <g transform="translate(10 12)">
    <circle cx="16" cy="16" r="${RING.r}" fill="none" stroke="#ffffff" stroke-width="${RING.stroke}" stroke-linecap="round" stroke-dasharray="${RING.ink.dash}" transform="rotate(${RING.ink.rotate} 16 16)"/>
    <circle cx="16" cy="16" r="${RING.r}" fill="none" stroke="#ffe15a" stroke-width="${RING.stroke}" stroke-linecap="round" stroke-dasharray="${RING.marker.dash}" transform="rotate(${RING.marker.rotate} 16 16)"/>
  </g>
  <text x="52" y="24" fill="#ffffff" fill-opacity="0.7" font-family="Helvetica, Arial, sans-serif" font-size="12">${label}</text>
  <text x="52" y="42" fill="#ffffff" font-family="Helvetica, Arial, sans-serif" font-size="12" fill-opacity="0.7">Growth Audit AI</text>
  <rect x="150" y="10" width="76" height="36" rx="9" fill="#ffe15a"/>
  <text x="188" y="30" text-anchor="middle" fill="#172033" font-family="Helvetica, Arial, sans-serif" font-size="19" font-weight="700">${audit.overallScore}<tspan font-size="11" font-weight="600">/100</tspan></text>
  <text x="188" y="41" text-anchor="middle" fill="#172033" font-family="Helvetica, Arial, sans-serif" font-size="9" font-weight="600">${grade}</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "X-Content-Type-Options": "nosniff",
      // Shown on other websites, so allow embedding from anywhere.
      "Access-Control-Allow-Origin": "*",
    },
  });
}
