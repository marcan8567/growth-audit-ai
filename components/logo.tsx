/**
 * The Growth Audit AI logo.
 *
 * The mark is a score ring, the product's signature element: mostly ink, with one segment in the
 * highlighter yellow used across the site. It reads as "a score" and stays recognisable at 16px.
 * The wordmark is the site's font with the same highlighter behind "AI".
 */

const INK = "#172033";
const MARKER = "#ffe15a";
const R = 11;
const C = 2 * Math.PI * R; // circumference of the ring

/** Ring geometry, shared with the favicon and preview cards so they always match. */
export const RING = {
  r: R,
  stroke: 5,
  // The ink arc covers 62% of the ring from the top, clockwise; the yellow segment 14%, after a gap.
  ink: { dash: `${(0.62 * C).toFixed(2)} ${C.toFixed(2)}`, rotate: -90 },
  marker: { dash: `${(0.14 * C).toFixed(2)} ${C.toFixed(2)}`, rotate: -90 + 0.74 * 360 },
};

export function LogoMark({ size = 28, inverse = false, title }: { size?: number; inverse?: boolean; title?: string }) {
  const main = inverse ? "#ffffff" : INK;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <circle
        cx="16"
        cy="16"
        r={RING.r}
        fill="none"
        stroke={main}
        strokeWidth={RING.stroke}
        strokeLinecap="round"
        strokeDasharray={RING.ink.dash}
        transform={`rotate(${RING.ink.rotate} 16 16)`}
      />
      <circle
        cx="16"
        cy="16"
        r={RING.r}
        fill="none"
        stroke={MARKER}
        strokeWidth={RING.stroke}
        strokeLinecap="round"
        strokeDasharray={RING.marker.dash}
        transform={`rotate(${RING.marker.rotate} 16 16)`}
      />
    </svg>
  );
}

/** Mark + wordmark. Text stays real text (sharp at any size, readable by screen readers). */
export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const mark = size === "lg" ? 36 : 28;
  const text = size === "lg" ? "text-2xl" : "text-lg";
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap text-ink">
      <LogoMark size={mark} />
      <span className={`${text} font-bold tracking-tight`}>
        Growth Audit <span className="marker px-0.5">AI</span>
      </span>
    </span>
  );
}
