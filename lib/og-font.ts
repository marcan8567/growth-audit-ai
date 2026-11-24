/**
 * The site's typeface (Schibsted Grotesk) for the link-preview images, which can't use web fonts.
 * Fetched from Google Fonts as a .ttf. If that fails, the images fall back to the default font.
 */

type OgFont = { name: string; data: ArrayBuffer; weight: 400 | 700; style: "normal" };

async function loadWeight(weight: 400 | 700): Promise<OgFont | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@${weight}`, { signal: AbortSignal.timeout(4_000) })
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    const data = await (await fetch(url, { signal: AbortSignal.timeout(4_000) })).arrayBuffer();
    return { name: "Schibsted Grotesk", data, weight, style: "normal" };
  } catch {
    return null;
  }
}

export async function ogFonts(): Promise<OgFont[]> {
  const fonts = await Promise.all([loadWeight(400), loadWeight(700)]);
  return fonts.filter((f): f is OgFont => f !== null);
}
