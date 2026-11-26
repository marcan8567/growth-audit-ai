import { ImageResponse } from "next/og";
import { ogFonts } from "@/lib/og-font";

/** The preview card for the homepage link: the headline and what the report contains. */

export const alt = "Growth Audit AI: paste a website, get its growth audit";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#172033";
const MARKER = "#ffe15a";

export default async function Image() {
  const fonts = await ogFonts();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#ffffff", padding: 72, color: INK, fontFamily: "Schibsted Grotesk" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, fontWeight: 700 }}>
          <svg width="40" height="40" viewBox="0 0 32 32"><circle cx="16" cy="16" r="11" fill="none" stroke="#172033" strokeWidth="5" strokeLinecap="round" strokeDasharray="42.85 69.12" transform="rotate(-90 16 16)" /><circle cx="16" cy="16" r="11" fill="none" stroke="#ffe15a" strokeWidth="5" strokeLinecap="round" strokeDasharray="9.68 69.12" transform="rotate(176.4 16 16)" /></svg>
          Growth Audit AI
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 700, lineHeight: 1, letterSpacing: -3 }}>Paste a website.</div>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 700, lineHeight: 1.1, letterSpacing: -3 }}>
            <span style={{ background: MARKER, padding: "0 12px", marginLeft: -12 }}>Get its growth audit.</span>
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#4a5468" }}>Scores, speed, keywords, brand voice, posts, automations. In a minute.</div>
      </div>
    ),
    { ...size, fonts },
  );
}
