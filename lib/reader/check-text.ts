import type { Lang } from "@/lib/i18n";

/** The wording of the code checks (lib/reader/checks.ts) and speed checks (lib/reader/pagespeed.ts), per language. */
export interface CheckText {
  https: { label: string; pass: string; fail: string };
  title: { label: string; missing: string; chars: (n: number) => string; short: string; long: string };
  meta: { label: string; missing: string; chars: (n: number) => string; short: string; long: string };
  h1: { label: string; one: string; none: string; many: (n: number) => string };
  cta: { label: string; found: (list: string) => string; none: string };
  depth: { label: string; words: (n: number) => string; js: string };
  pricing: { label: string; pass: string; fail: string };
  blog: { label: string; pass: string; fail: string };
  about: { label: string; pass: string; fail: string };
  social: { label: string; none: string };
  speed: {
    realUsers: string;
    mobileTest: string;
    perfLabel: string;
    perfDetail: (score: number) => string;
    perfSlow: string;
    lcpLabel: string;
    clsLabel: string;
    inpLabel: string;
    seoLabel: string;
    target: (value: string, source: string, goal: string) => string;
  };
}

export const CHECK_TEXT: Record<Lang, CheckText> = {
  en: {
    https: { label: "Secure connection (HTTPS)", pass: "The site loads over HTTPS.", fail: "The site does not load over HTTPS." },
    title: {
      label: "Homepage title",
      missing: "The homepage has no <title>.",
      chars: (n) => `${n} characters`,
      short: " (short; 30–65 is typical for search results)",
      long: " (long; search results cut it off after about 65)",
    },
    meta: {
      label: "Meta description",
      missing: "No meta description, so search engines choose their own snippet.",
      chars: (n) => `${n} characters`,
      short: " (short; 70–160 is typical)",
      long: " (long; search results cut it off after about 160)",
    },
    h1: { label: "One main heading (H1)", one: "The homepage has exactly one H1.", none: "The homepage has no H1.", many: (n) => `The homepage has ${n} different H1s.` },
    cta: { label: "Calls to action on the homepage", found: (l) => `Found: ${l}`, none: "No clear call to action found." },
    depth: {
      label: "Homepage content depth",
      words: (n) => `${n} words of readable text`,
      js: " (the site may build its content with JavaScript, which this reader can't run)",
    },
    pricing: { label: "Pricing page", pass: "A pricing page is linked from the homepage.", fail: "No pricing page linked from the homepage." },
    blog: { label: "Blog or resources", pass: "A blog or resources section is linked.", fail: "No blog or resources section linked from the homepage." },
    about: { label: "About page", pass: "An about page is linked.", fail: "No about page linked from the homepage." },
    social: { label: "Social profiles linked", none: "No social profiles linked from the website." },
    speed: {
      realUsers: "real Chrome users",
      mobileTest: "Google's mobile test",
      perfLabel: "Mobile performance score (Google)",
      perfDetail: (s) => `${s}/100 on Google's mobile test`,
      perfSlow: " (slow pages lose visitors and rank lower)",
      lcpLabel: "Main content loads quickly (LCP)",
      clsLabel: "Page doesn't jump while loading (CLS)",
      inpLabel: "Responds quickly to clicks (INP)",
      seoLabel: "Technical SEO (Google Lighthouse)",
      target: (v, src, goal) => `${v} for ${src} (Google's target: ${goal}).`,
    },
  },
  es: {
    https: { label: "Conexión segura (HTTPS)", pass: "El sitio carga con HTTPS.", fail: "El sitio no carga con HTTPS." },
    title: {
      label: "Título de la página de inicio",
      missing: "La página de inicio no tiene <title>.",
      chars: (n) => `${n} caracteres`,
      short: " (corto; lo habitual en los resultados de búsqueda son 30–65)",
      long: " (largo; los resultados de búsqueda lo cortan a partir de unos 65)",
    },
    meta: {
      label: "Meta descripción",
      missing: "No hay meta descripción, así que los buscadores eligen su propio fragmento.",
      chars: (n) => `${n} caracteres`,
      short: " (corta; lo habitual son 70–160)",
      long: " (larga; los resultados de búsqueda la cortan a partir de unos 160)",
    },
    h1: {
      label: "Un único encabezado principal (H1)",
      one: "La página de inicio tiene exactamente un H1.",
      none: "La página de inicio no tiene H1.",
      many: (n) => `La página de inicio tiene ${n} H1 distintos.`,
    },
    cta: { label: "Llamadas a la acción en la página de inicio", found: (l) => `Encontradas: ${l}`, none: "No se ha encontrado una llamada a la acción clara." },
    depth: {
      label: "Profundidad del contenido de inicio",
      words: (n) => `${n} palabras de texto legible`,
      js: " (puede que el sitio genere su contenido con JavaScript, que este lector no ejecuta)",
    },
    pricing: { label: "Página de precios", pass: "La página de inicio enlaza una página de precios.", fail: "La página de inicio no enlaza ninguna página de precios." },
    blog: { label: "Blog o recursos", pass: "Hay un enlace a un blog o sección de recursos.", fail: "La página de inicio no enlaza ningún blog ni sección de recursos." },
    about: { label: "Página «Sobre nosotros»", pass: "Hay un enlace a una página «Sobre nosotros».", fail: "La página de inicio no enlaza ninguna página «Sobre nosotros»." },
    social: { label: "Perfiles sociales enlazados", none: "El sitio no enlaza ningún perfil social." },
    speed: {
      realUsers: "usuarios reales de Chrome",
      mobileTest: "la prueba móvil de Google",
      perfLabel: "Rendimiento en móvil (Google)",
      perfDetail: (s) => `${s}/100 en la prueba móvil de Google`,
      perfSlow: " (las páginas lentas pierden visitantes y posicionan peor)",
      lcpLabel: "El contenido principal carga rápido (LCP)",
      clsLabel: "La página no se mueve al cargar (CLS)",
      inpLabel: "Responde rápido a los clics (INP)",
      seoLabel: "SEO técnico (Google Lighthouse)",
      target: (v, src, goal) => `${v} para ${src} (objetivo de Google: ${goal}).`,
    },
  },
  de: {
    https: { label: "Sichere Verbindung (HTTPS)", pass: "Die Website lädt über HTTPS.", fail: "Die Website lädt nicht über HTTPS." },
    title: {
      label: "Titel der Startseite",
      missing: "Die Startseite hat keinen <title>.",
      chars: (n) => `${n} Zeichen`,
      short: " (kurz; üblich sind 30–65 für Suchergebnisse)",
      long: " (lang; Suchergebnisse schneiden ihn nach etwa 65 ab)",
    },
    meta: {
      label: "Meta-Beschreibung",
      missing: "Keine Meta-Beschreibung, daher wählen Suchmaschinen selbst einen Ausschnitt.",
      chars: (n) => `${n} Zeichen`,
      short: " (kurz; üblich sind 70–160)",
      long: " (lang; Suchergebnisse schneiden sie nach etwa 160 ab)",
    },
    h1: { label: "Eine Hauptüberschrift (H1)", one: "Die Startseite hat genau eine H1.", none: "Die Startseite hat keine H1.", many: (n) => `Die Startseite hat ${n} verschiedene H1.` },
    cta: { label: "Handlungsaufforderungen auf der Startseite", found: (l) => `Gefunden: ${l}`, none: "Keine klare Handlungsaufforderung gefunden." },
    depth: {
      label: "Inhaltstiefe der Startseite",
      words: (n) => `${n} Wörter lesbarer Text`,
      js: " (die Website baut ihre Inhalte eventuell mit JavaScript auf, das dieser Leser nicht ausführt)",
    },
    pricing: { label: "Preisseite", pass: "Die Startseite verlinkt eine Preisseite.", fail: "Die Startseite verlinkt keine Preisseite." },
    blog: { label: "Blog oder Ressourcen", pass: "Ein Blog oder Ressourcenbereich ist verlinkt.", fail: "Die Startseite verlinkt keinen Blog und keinen Ressourcenbereich." },
    about: { label: "Über-uns-Seite", pass: "Eine Über-uns-Seite ist verlinkt.", fail: "Die Startseite verlinkt keine Über-uns-Seite." },
    social: { label: "Verlinkte Social-Media-Profile", none: "Die Website verlinkt keine Social-Media-Profile." },
    speed: {
      realUsers: "echte Chrome-Nutzer",
      mobileTest: "Googles Mobiltest",
      perfLabel: "Mobile Leistung (Google)",
      perfDetail: (s) => `${s}/100 in Googles Mobiltest`,
      perfSlow: " (langsame Seiten verlieren Besucher und ranken schlechter)",
      lcpLabel: "Hauptinhalt lädt schnell (LCP)",
      clsLabel: "Seite springt beim Laden nicht (CLS)",
      inpLabel: "Reagiert schnell auf Klicks (INP)",
      seoLabel: "Technisches SEO (Google Lighthouse)",
      target: (v, src, goal) => `${v} für ${src} (Googles Ziel: ${goal}).`,
    },
  },
};
