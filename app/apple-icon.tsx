import { ImageResponse } from "next/og";

/** Home-screen icon (iPhone and iPad): the same ring as the browser-tab icon, at 180×180. */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const r = 56;
  const c = 2 * Math.PI * r;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#172033" }}>
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle cx="90" cy="90" r={r} fill="none" stroke="#ffffff" strokeWidth="26" strokeLinecap="round" strokeDasharray={`${0.62 * c} ${c}`} transform="rotate(-90 90 90)" />
          <circle cx="90" cy="90" r={r} fill="none" stroke="#ffe15a" strokeWidth="26" strokeLinecap="round" strokeDasharray={`${0.14 * c} ${c}`} transform={`rotate(${-90 + 0.74 * 360} 90 90)`} />
        </svg>
      </div>
    ),
    size,
  );
}
