import type { Lang } from "@/lib/i18n";

/**
 * Every fixed text in the report, per language. The AI-written parts arrive in the report's language
 * already; this covers the headings, labels and buttons around them. Add a key here when adding a label.
 */
export interface ReportText {
  menu: Record<"overview" | "scores" | "quickWins" | "checks" | "speed" | "keywords" | "brandVoice" | "posts" | "automations" | "compare" | "outreach" | "contact", string>;
  shareReport: string;
  linkCopied: string;
  shareOn: (network: string) => string;
  shareText: (name: string, score: number) => string;
  savePdf: string;
  cardLabel: string;
  analysisOf: (domain: string, date: string) => string;
  outOf100: string;
  biggestOpportunity: string;
  grade: Record<string, string>;
  category: Record<string, string>;
  level: Record<string, string>;
  impact: string;
  effort: string;
  scoresTitle: string;
  scoresSubtitle: string;
  detailsTitle: string;
  detailsSubtitle: (verified: number, total: number) => string;
  strengths: string;
  issues: string;
  verified: string;
  notFound: string;
  quickWinsTitle: string;
  quickWinsSubtitle: string;
  hiddenTitle: (count: number, domain?: string) => string;
  hiddenText: string;
  placeholder: [string, string, string];
  messageMe: string;
  checksTitle: string;
  checksSubtitle: (pages: string[], failed: number) => string;
  passedSummary: (passed: number, toFix: number) => string;
  pageKind: Record<string, string>;
  status: Record<"pass" | "warn" | "fail", string>;
  speedTitle: string;
  speedSubtitle: (field: boolean, wholeSite: boolean) => string;
  speedScores: Record<"performance" | "seo" | "accessibility" | "bestPractices", string>;
  keywordsTitle: string;
  keywordsSubtitle: string;
  targetsToday: string;
  places: Record<"title" | "h1" | "headings" | "meta" | "url", string>;
  mentions: string;
  yes: string;
  no: string;
  dropped: (n: number) => string;
  worthTargeting: string;
  intent: Record<string, string>;
  mentionedNotTargeted: string;
  notOnSite: string;
  voiceTitle: string;
  voiceSubtitle: (verified: number, total: number) => string;
  positioning: string;
  audience: string;
  also: string;
  postsTitle: (count: number) => string;
  postsSubtitle: (platforms: string[]) => string;
  copyPost: (platform: string) => string;
  copied: string;
  theme: string;
  characters: string;
  contentPlanTitle: (domain: string) => string;
  contentPlanText: (themes: string) => string;
  automationsTitle: string;
  trigger: string;
  step: (n: number) => string;
  result: string;
  whereAiHelps: string;
  leadTitle: string;
  leadText: (domain?: string) => string;
  leadThanks: (domain?: string) => string;
  yourEmail: string;
  sending: string;
  sendFixes: string;
  leadSmallPrint: string;
  privacyPolicy: string;
  or: string;
  messageMeLower: string;
  somethingWrong: string;
  disclaimer: (domain: string, name: string, competitors: string[]) => string;
  compareTitle: string;
  compareSubtitle: string;
  overall: string;
  thisSite: string;
  leads: (areas: string) => string;
  trails: (areas: string, rival: string) => string;
  compareFailed: (domain: string) => string;
  benchmark: (average: number, total: number) => string;
  betterThan: (percent: number) => string;
  badgeTitle: (grade: string) => string;
  badgeText: string;
  copyCode: string;
  codeCopied: string;
  badgeAlt: (score: number) => string;
  outreach: {
    title: string;
    subtitle: string;
    yourName: string;
    yourCompany: string;
    yourOffer: string;
    offerPlaceholder: string;
    contactName: string;
    create: string;
    creating: string;
    again: string;
    findings: string;
    bestContact: (role: string) => string;
    roles: Record<"marketing" | "growth" | "founder", string>;
    searchWord: Record<"marketing" | "growth" | "founder", string>;
    companyPage: string;
    findPerson: string;
    connectionNote: string;
    followUp: string;
    email: string;
    emailNote: string;
    subject: string;
    openers: string;
    style: Record<"curiosity" | "number" | "compliment", string>;
    chars: (n: number, max: number) => string;
    copy: string;
    error: string;
  };
}

const join = (items: string[], and: string) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} ${and} ${items[items.length - 1]}`;

export const REPORT_TEXT: Record<Lang, ReportText> = {
  en: {
    menu: {
      overview: "Overview",
      scores: "Scores",
      quickWins: "Quick wins",
      checks: "Checks",
      speed: "Speed",
      keywords: "Keywords",
      brandVoice: "Brand voice",
      posts: "Posts",
      automations: "Automations",
      compare: "Competitors",
      outreach: "Outreach",
      contact: "Get help",
    },
    shareReport: "Share report",
    linkCopied: "Link copied",
    shareOn: (n) => `Share on ${n}`,
    shareText: (name, score) => `${name} scored ${score}/100 in this AI growth audit`,
    savePdf: "Save as PDF",
    cardLabel: "Growth audit",
    analysisOf: (d, date) => `Automated AI analysis of ${d}, ${date}`,
    outOf100: "out of 100",
    biggestOpportunity: "Biggest opportunity",
    grade: { Weak: "Weak", Average: "Average", Strong: "Strong", Excellent: "Excellent" },
    category: {
      messaging: "Value proposition & messaging",
      conversion: "Conversion & calls to action",
      seo: "SEO basics",
      content: "Content & thought leadership",
      social: "Social presence",
      trust: "Trust & social proof",
    },
    level: { low: "low", medium: "medium", high: "high" },
    impact: "Impact",
    effort: "Effort",
    scoresTitle: "Scores at a glance",
    scoresSubtitle: "Each area scored from 0 to 10 by the AI; the overall score is calculated by code.",
    detailsTitle: "Why each score",
    detailsSubtitle: (v, t) => `Strengths, issues and the quotes behind them. ${v} of ${t} quotes were found word for word on the website.`,
    strengths: "Strengths",
    issues: "Issues",
    verified: "verified on the site",
    notFound: "not found on the site",
    quickWinsTitle: "Quick wins",
    quickWinsSubtitle: "The changes most likely to grow leads and revenue, best first.",
    hiddenTitle: (c, d) => `${c} more ${c === 1 ? "fix" : "fixes"}${d ? ` for ${d}` : ""}, ranked by impact`,
    hiddenText: "Message me on LinkedIn and I'll send you the full list, and help you put the fixes in place.",
    placeholder: ["Placeholder fix title for this website", "What to change, specific to this company, and where on the website.", "The effect this is expected to have on growth."],
    messageMe: "Message me on LinkedIn",
    checksTitle: "Website checks",
    checksSubtitle: (pages, failed) =>
      `Measured by code, not AI, on ${pages.length} page${pages.length === 1 ? "" : "s"}: ${pages.join(", ")}${failed ? ` (${failed} could not be read)` : ""}.`,
    passedSummary: (p, f) => `${p} passed${f ? `, ${f} to fix` : ", nothing to fix"}`,
    pageKind: { home: "home", about: "about", pricing: "pricing", product: "product", blog: "blog" },
    status: { pass: "Passed", warn: "Needs attention", fail: "Failed" },
    speedTitle: "Speed and mobile",
    speedSubtitle: (field, whole) =>
      `Measured by Google PageSpeed Insights on a mobile phone${field ? `, with real Chrome users over the last 28 days${whole ? " (whole website)" : ""}` : ""}. Not AI.`,
    speedScores: { performance: "Performance", seo: "SEO", accessibility: "Accessibility", bestPractices: "Best practices" },
    keywordsTitle: "Keywords",
    keywordsSubtitle:
      "The search phrases the website is built around, and five worth adding. The AI suggests the phrases; where each one appears is checked in code. These are not Google rankings.",
    targetsToday: "Targets today",
    places: { title: "Title", h1: "H1", headings: "Headings", meta: "Meta", url: "URL" },
    mentions: "Mentions",
    yes: "Yes",
    no: "No",
    dropped: (n) => `${n} ${n === 1 ? "keyword" : "keywords"} the AI named couldn't be found on the website, so ${n === 1 ? "it was" : "they were"} left out.`,
    worthTargeting: "Worth targeting next",
    intent: { informational: "informational", commercial: "commercial", transactional: "transactional", navigational: "navigational" },
    mentionedNotTargeted: "Mentioned, not targeted",
    notOnSite: "Not on the site yet",
    voiceTitle: "Brand voice",
    voiceSubtitle: (v, t) => `How the website sounds and who it speaks to. ${v} of ${t} quotes were found word for word on the website.`,
    positioning: "Positioning",
    audience: "Audience",
    also: "Also:",
    postsTitle: (c) => (c > 1 ? "Social media posts" : "Social media post"),
    postsSubtitle: (p) => `Ready to post, in the brand's voice, previewed as they would look on ${join(p, "and")}.`,
    copyPost: (p) => `Copy ${p} post`,
    copied: "Copied",
    theme: "Theme",
    characters: "characters",
    contentPlanTitle: (d) => `Want a full content plan${d ? ` for ${d}` : ""}?`,
    contentPlanText: (t) => `Two weeks of posts like these, built on the three themes that suit the company best: ${t}. Send me a message and I'll put it together.`,
    automationsTitle: "Automation plan",
    trigger: "Trigger",
    step: (n) => `Step ${n}`,
    result: "Result",
    whereAiHelps: "Where AI helps:",
    leadTitle: "Want a hand putting this into practice?",
    leadText: (d) => `Leave your email and I'll send you the full list of fixes${d ? ` for ${d}` : ""}, with where I'd start.`,
    leadThanks: (d) => `Thanks! I'll get back to you by email${d ? ` about ${d}` : ""}.`,
    yourEmail: "Your email",
    sending: "Sending…",
    sendFixes: "Send me the fixes",
    leadSmallPrint: "Optional. I only use your email to reply to you; it's deleted after 12 months.",
    privacyPolicy: "Privacy policy",
    or: "or",
    messageMeLower: "message me on LinkedIn",
    somethingWrong: "Something went wrong. Please try again.",
    disclaimer: (d, n, c) =>
      `This report was generated automatically with AI (Google Gemini), using only the public website of ${d}${c.length ? ` and of ${join(c, "and")}` : ""} and Google PageSpeed measurements. It can contain errors and is not professional advice. Growth Audit AI is an independent project and is not affiliated with or endorsed by ${n}${c.length ? " or the companies it is compared with" : ""}. Company names and logos belong to their owners and are shown only to identify the websites analysed.`,
    compareTitle: "Compared with competitors",
    compareSubtitle: "The same six areas, scored the same way for each website. Who leads where is worked out by code.",
    overall: "Overall",
    thisSite: "this site",
    leads: (a) => `Ahead of every competitor in ${a}.`,
    trails: (a, r) => `Behind ${r} in ${a}.`,
    compareFailed: (d) => `${d} couldn't be audited, so it's left out.`,
    benchmark: (a, t) => `Average across ${t} audited websites: ${a}`,
    betterThan: (p) => `better than ${p}%`,
    badgeTitle: (g) => `A score worth showing: ${g}`,
    badgeText: "Add this badge to your website. It links to this report, so visitors can see the details.",
    copyCode: "Copy code",
    codeCopied: "Code copied",
    badgeAlt: (s) => `Growth score ${s}/100`,
    outreach: {
      title: "Reach out to this company",
      subtitle: "Ready-to-send first messages, built only from this report: every finding and number comes from the audit. Written by AI on request; check them before sending.",
      yourName: "Your name",
      yourCompany: "Your company",
      yourOffer: "What you offer",
      offerPlaceholder: "e.g. SEO, marketing automation, ads",
      contactName: "Contact's first name",
      create: "Write the messages",
      creating: "Writing…",
      again: "Write new versions",
      findings: "Built on these findings",
      bestContact: (r) => `Best person to contact: ${r}`,
      roles: { marketing: "Head of Marketing or founder", growth: "Head of Growth or marketing lead", founder: "Founder or CEO" },
      searchWord: { marketing: "marketing", growth: "growth", founder: "founder" },
      companyPage: "Open company page",
      findPerson: "Find the right person on LinkedIn",
      connectionNote: "LinkedIn connection note",
      followUp: "LinkedIn message after they accept",
      email: "Email version",
      emailNote: "In Spain, Germany and much of the EU, marketing emails need prior consent, even business to business. Use this for existing contacts and people who asked to hear from you; for strangers, use LinkedIn.",
      subject: "Subject",
      openers: "Other ways to open",
      style: { curiosity: "Curiosity", number: "Number", compliment: "Strength first" },
      chars: (n, m) => `${n}/${m} characters`,
      copy: "Copy",
      error: "Couldn't write the messages. Please try again.",
    },
  },
  es: {
    menu: {
      overview: "Resumen",
      scores: "Puntuaciones",
      quickWins: "Mejoras rápidas",
      checks: "Comprobaciones",
      speed: "Velocidad",
      keywords: "Palabras clave",
      brandVoice: "Voz de marca",
      posts: "Publicaciones",
      automations: "Automatizaciones",
      compare: "Competidores",
      outreach: "Contacto",
      contact: "Ayuda",
    },
    shareReport: "Compartir informe",
    linkCopied: "Enlace copiado",
    shareOn: (n) => `Compartir en ${n}`,
    shareText: (name, score) => `${name} obtuvo ${score}/100 en esta auditoría de crecimiento con IA`,
    savePdf: "Guardar como PDF",
    cardLabel: "Auditoría de crecimiento",
    analysisOf: (d, date) => `Análisis automático con IA de ${d}, ${date}`,
    outOf100: "de 100",
    biggestOpportunity: "Mayor oportunidad",
    grade: { Weak: "Débil", Average: "Medio", Strong: "Sólido", Excellent: "Excelente" },
    category: {
      messaging: "Propuesta de valor y mensaje",
      conversion: "Conversión y llamadas a la acción",
      seo: "SEO básico",
      content: "Contenido y liderazgo de opinión",
      social: "Presencia en redes",
      trust: "Confianza y prueba social",
    },
    level: { low: "bajo", medium: "medio", high: "alto" },
    impact: "Impacto",
    effort: "Esfuerzo",
    scoresTitle: "Puntuaciones de un vistazo",
    scoresSubtitle: "La IA puntúa cada área de 0 a 10; la puntuación total la calcula el código.",
    detailsTitle: "Por qué cada puntuación",
    detailsSubtitle: (v, t) => `Puntos fuertes, problemas y las citas que los respaldan. ${v} de ${t} citas aparecen literalmente en el sitio.`,
    strengths: "Puntos fuertes",
    issues: "Problemas",
    verified: "verificada en el sitio",
    notFound: "no encontrada en el sitio",
    quickWinsTitle: "Mejoras rápidas",
    quickWinsSubtitle: "Los cambios con más probabilidad de aumentar clientes potenciales e ingresos, de mejor a peor.",
    hiddenTitle: (c, d) => `${c} ${c === 1 ? "mejora más" : "mejoras más"}${d ? ` para ${d}` : ""}, ordenadas por impacto`,
    hiddenText: "Escríbeme por LinkedIn y te envío la lista completa, y te ayudo a ponerla en práctica.",
    placeholder: ["Título de ejemplo de una mejora para este sitio", "Qué cambiar, específico para esta empresa, y dónde en el sitio.", "El efecto esperado en el crecimiento."],
    messageMe: "Escríbeme por LinkedIn",
    checksTitle: "Comprobaciones del sitio",
    checksSubtitle: (pages, failed) =>
      `Medido con código, no con IA, en ${pages.length} ${pages.length === 1 ? "página" : "páginas"}: ${pages.join(", ")}${failed ? ` (${failed} no se ${failed === 1 ? "pudo" : "pudieron"} leer)` : ""}.`,
    passedSummary: (p, f) => `${p} ${p === 1 ? "superada" : "superadas"}${f ? `, ${f} por mejorar` : ", nada que mejorar"}`,
    pageKind: { home: "inicio", about: "sobre nosotros", pricing: "precios", product: "servicios", blog: "blog" },
    status: { pass: "Superada", warn: "Revisar", fail: "No superada" },
    speedTitle: "Velocidad y móvil",
    speedSubtitle: (field, whole) =>
      `Medido por Google PageSpeed Insights en un móvil${field ? `, con usuarios reales de Chrome en los últimos 28 días${whole ? " (todo el sitio)" : ""}` : ""}. Sin IA.`,
    speedScores: { performance: "Rendimiento", seo: "SEO", accessibility: "Accesibilidad", bestPractices: "Buenas prácticas" },
    keywordsTitle: "Palabras clave",
    keywordsSubtitle:
      "Las búsquedas en torno a las que está construido el sitio, y cinco que vale la pena añadir. La IA propone las frases; dónde aparece cada una lo comprueba el código. No son posiciones en Google.",
    targetsToday: "Objetivos actuales",
    places: { title: "Título", h1: "H1", headings: "Encabezados", meta: "Meta", url: "URL" },
    mentions: "Menciones",
    yes: "Sí",
    no: "No",
    dropped: (n) => `${n} ${n === 1 ? "palabra clave que nombró la IA no aparece" : "palabras clave que nombró la IA no aparecen"} en el sitio, así que ${n === 1 ? "se ha omitido" : "se han omitido"}.`,
    worthTargeting: "Vale la pena trabajar",
    intent: { informational: "informativa", commercial: "comercial", transactional: "transaccional", navigational: "de navegación" },
    mentionedNotTargeted: "Mencionada, no trabajada",
    notOnSite: "Aún no está en el sitio",
    voiceTitle: "Voz de marca",
    voiceSubtitle: (v, t) => `Cómo suena el sitio y a quién se dirige. ${v} de ${t} citas aparecen literalmente en el sitio.`,
    positioning: "Posicionamiento",
    audience: "Público",
    also: "También:",
    postsTitle: (c) => (c > 1 ? "Publicaciones para redes sociales" : "Publicación para redes sociales"),
    postsSubtitle: (p) => `Listas para publicar, con la voz de la marca, tal como se verían en ${join(p, "y")}.`,
    copyPost: (p) => `Copiar publicación de ${p}`,
    copied: "Copiado",
    theme: "Tema",
    characters: "caracteres",
    contentPlanTitle: (d) => `¿Quieres un plan de contenidos completo${d ? ` para ${d}` : ""}?`,
    contentPlanText: (t) => `Dos semanas de publicaciones como estas, basadas en los tres temas que mejor encajan con la empresa: ${t}. Escríbeme y lo preparo.`,
    automationsTitle: "Plan de automatización",
    trigger: "Disparador",
    step: (n) => `Paso ${n}`,
    result: "Resultado",
    whereAiHelps: "Dónde ayuda la IA:",
    leadTitle: "¿Te ayudo a ponerlo en práctica?",
    leadText: (d) => `Déjame tu email y te envío la lista completa de mejoras${d ? ` para ${d}` : ""}, con por dónde empezaría.`,
    leadThanks: (d) => `¡Gracias! Te responderé por email${d ? ` sobre ${d}` : ""}.`,
    yourEmail: "Tu email",
    sending: "Enviando…",
    sendFixes: "Envíame las mejoras",
    leadSmallPrint: "Opcional. Solo uso tu email para responderte; se borra a los 12 meses.",
    privacyPolicy: "Política de privacidad",
    or: "o",
    messageMeLower: "escríbeme por LinkedIn",
    somethingWrong: "Algo ha fallado. Inténtalo de nuevo.",
    disclaimer: (d, n, c) =>
      `Este informe se ha generado automáticamente con IA (Google Gemini), usando solo el sitio web público de ${d}${c.length ? ` y de ${join(c, "y")}` : ""} y mediciones de Google PageSpeed. Puede contener errores y no es asesoramiento profesional. Growth Audit AI es un proyecto independiente y no está afiliado ni respaldado por ${n}${c.length ? " ni por las empresas con las que se compara" : ""}. Los nombres y logotipos pertenecen a sus propietarios y solo se muestran para identificar los sitios analizados.`,
    compareTitle: "Comparación con competidores",
    compareSubtitle: "Las mismas seis áreas, puntuadas igual para cada sitio. Quién va por delante en cada una lo calcula el código.",
    overall: "Total",
    thisSite: "este sitio",
    leads: (a) => `Por delante de todos los competidores en ${a}.`,
    trails: (a, r) => `Por detrás de ${r} en ${a}.`,
    compareFailed: (d) => `No se pudo auditar ${d}, así que se ha omitido.`,
    benchmark: (a, t) => `Media de ${t} sitios auditados: ${a}`,
    betterThan: (p) => `mejor que el ${p}%`,
    badgeTitle: (g) => `Una puntuación para presumir: ${g}`,
    badgeText: "Añade este distintivo a tu web. Enlaza a este informe, así los visitantes pueden ver los detalles.",
    copyCode: "Copiar código",
    codeCopied: "Código copiado",
    badgeAlt: (s) => `Puntuación de crecimiento ${s}/100`,
    outreach: {
      title: "Contacta con esta empresa",
      subtitle: "Primeros mensajes listos para enviar, basados solo en este informe: cada hallazgo y cada cifra salen de la auditoría. Los escribe la IA cuando lo pides; revísalos antes de enviarlos.",
      yourName: "Tu nombre",
      yourCompany: "Tu empresa",
      yourOffer: "Qué ofreces",
      offerPlaceholder: "p. ej. SEO, automatización de marketing, anuncios",
      contactName: "Nombre del contacto",
      create: "Escribir los mensajes",
      creating: "Escribiendo…",
      again: "Escribir otras versiones",
      findings: "Basados en estos hallazgos",
      bestContact: (r) => `Mejor persona de contacto: ${r}`,
      roles: { marketing: "responsable de marketing o fundador", growth: "responsable de crecimiento o de marketing", founder: "fundador o CEO" },
      searchWord: { marketing: "marketing", growth: "growth", founder: "fundador" },
      companyPage: "Abrir página de empresa",
      findPerson: "Buscar a la persona adecuada en LinkedIn",
      connectionNote: "Nota de invitación en LinkedIn",
      followUp: "Mensaje de LinkedIn tras aceptar",
      email: "Versión para email",
      emailNote: "En España, Alemania y gran parte de la UE, los emails comerciales necesitan consentimiento previo, también entre empresas. Úsalo con contactos existentes y con quien te haya pedido información; para desconocidos, usa LinkedIn.",
      subject: "Asunto",
      openers: "Otras formas de empezar",
      style: { curiosity: "Curiosidad", number: "Cifra", compliment: "Primero un punto fuerte" },
      chars: (n, m) => `${n}/${m} caracteres`,
      copy: "Copiar",
      error: "No se pudieron escribir los mensajes. Inténtalo de nuevo.",
    },
  },
  de: {
    menu: {
      overview: "Überblick",
      scores: "Bewertungen",
      quickWins: "Quick Wins",
      checks: "Prüfungen",
      speed: "Tempo",
      keywords: "Keywords",
      brandVoice: "Markenstimme",
      posts: "Beiträge",
      automations: "Automatisierungen",
      compare: "Wettbewerber",
      outreach: "Ansprache",
      contact: "Hilfe",
    },
    shareReport: "Bericht teilen",
    linkCopied: "Link kopiert",
    shareOn: (n) => `Auf ${n} teilen`,
    shareText: (name, score) => `${name} erreicht ${score}/100 in diesem KI-Wachstumsaudit`,
    savePdf: "Als PDF speichern",
    cardLabel: "Wachstumsaudit",
    analysisOf: (d, date) => `Automatische KI-Analyse von ${d}, ${date}`,
    outOf100: "von 100",
    biggestOpportunity: "Größte Chance",
    grade: { Weak: "Schwach", Average: "Mittel", Strong: "Stark", Excellent: "Hervorragend" },
    category: {
      messaging: "Nutzenversprechen & Botschaft",
      conversion: "Conversion & Handlungsaufforderungen",
      seo: "SEO-Grundlagen",
      content: "Content & Thought Leadership",
      social: "Social-Media-Präsenz",
      trust: "Vertrauen & Social Proof",
    },
    level: { low: "gering", medium: "mittel", high: "hoch" },
    impact: "Wirkung",
    effort: "Aufwand",
    scoresTitle: "Bewertungen auf einen Blick",
    scoresSubtitle: "Die KI bewertet jeden Bereich von 0 bis 10; die Gesamtpunktzahl berechnet der Code.",
    detailsTitle: "Warum diese Bewertungen",
    detailsSubtitle: (v, t) => `Stärken, Schwächen und die Zitate dahinter. ${v} von ${t} Zitaten wurden wörtlich auf der Website gefunden.`,
    strengths: "Stärken",
    issues: "Schwächen",
    verified: "auf der Website bestätigt",
    notFound: "nicht auf der Website gefunden",
    quickWinsTitle: "Quick Wins",
    quickWinsSubtitle: "Die Änderungen, die am ehesten mehr Leads und Umsatz bringen, das Wichtigste zuerst.",
    hiddenTitle: (c, d) => `${c} weitere ${c === 1 ? "Verbesserung" : "Verbesserungen"}${d ? ` für ${d}` : ""}, nach Wirkung sortiert`,
    hiddenText: "Schreiben Sie mir auf LinkedIn, dann schicke ich Ihnen die vollständige Liste und helfe bei der Umsetzung.",
    placeholder: ["Beispieltitel einer Verbesserung für diese Website", "Was sich ändern sollte, passend zu diesem Unternehmen, und wo auf der Website.", "Die erwartete Wirkung auf das Wachstum."],
    messageMe: "Auf LinkedIn schreiben",
    checksTitle: "Website-Prüfungen",
    checksSubtitle: (pages, failed) =>
      `Von Code gemessen, nicht von KI, auf ${pages.length} ${pages.length === 1 ? "Seite" : "Seiten"}: ${pages.join(", ")}${failed ? ` (${failed} nicht lesbar)` : ""}.`,
    passedSummary: (p, f) => `${p} bestanden${f ? `, ${f} zu verbessern` : ", nichts zu verbessern"}`,
    pageKind: { home: "Startseite", about: "Über uns", pricing: "Preise", product: "Leistungen", blog: "Blog" },
    status: { pass: "Bestanden", warn: "Prüfen", fail: "Nicht bestanden" },
    speedTitle: "Tempo und Mobil",
    speedSubtitle: (field, whole) =>
      `Gemessen mit Google PageSpeed Insights auf einem Smartphone${field ? `, mit echten Chrome-Nutzern der letzten 28 Tage${whole ? " (ganze Website)" : ""}` : ""}. Keine KI.`,
    speedScores: { performance: "Leistung", seo: "SEO", accessibility: "Barrierefreiheit", bestPractices: "Best Practices" },
    keywordsTitle: "Keywords",
    keywordsSubtitle:
      "Die Suchbegriffe, um die die Website aufgebaut ist, und fünf, die sich lohnen. Die KI schlägt die Begriffe vor; wo jeder vorkommt, prüft der Code. Das sind keine Google-Rankings.",
    targetsToday: "Aktuelle Ziele",
    places: { title: "Titel", h1: "H1", headings: "Überschriften", meta: "Meta", url: "URL" },
    mentions: "Nennungen",
    yes: "Ja",
    no: "Nein",
    dropped: (n) => `${n} ${n === 1 ? "von der KI genanntes Keyword wurde" : "von der KI genannte Keywords wurden"} nicht auf der Website gefunden und daher weggelassen.`,
    worthTargeting: "Lohnt sich als Nächstes",
    intent: { informational: "informativ", commercial: "kommerziell", transactional: "transaktional", navigational: "navigational" },
    mentionedNotTargeted: "Erwähnt, nicht optimiert",
    notOnSite: "Noch nicht auf der Website",
    voiceTitle: "Markenstimme",
    voiceSubtitle: (v, t) => `Wie die Website klingt und wen sie anspricht. ${v} von ${t} Zitaten wurden wörtlich auf der Website gefunden.`,
    positioning: "Positionierung",
    audience: "Zielgruppe",
    also: "Außerdem:",
    postsTitle: (c) => (c > 1 ? "Social-Media-Beiträge" : "Social-Media-Beitrag"),
    postsSubtitle: (p) => `Bereit zum Posten, in der Stimme der Marke, so wie sie auf ${join(p, "und")} aussehen würden.`,
    copyPost: (p) => `${p}-Beitrag kopieren`,
    copied: "Kopiert",
    theme: "Thema",
    characters: "Zeichen",
    contentPlanTitle: (d) => `Einen vollständigen Content-Plan${d ? ` für ${d}` : ""}?`,
    contentPlanText: (t) => `Zwei Wochen Beiträge wie diese, aufgebaut auf den drei Themen, die am besten zum Unternehmen passen: ${t}. Schreiben Sie mir, dann stelle ich ihn zusammen.`,
    automationsTitle: "Automatisierungsplan",
    trigger: "Auslöser",
    step: (n) => `Schritt ${n}`,
    result: "Ergebnis",
    whereAiHelps: "Wo KI hilft:",
    leadTitle: "Hilfe bei der Umsetzung?",
    leadText: (d) => `Hinterlassen Sie Ihre E-Mail, dann schicke ich Ihnen die vollständige Liste${d ? ` für ${d}` : ""}, mit meinem Vorschlag, wo Sie anfangen.`,
    leadThanks: (d) => `Danke! Ich melde mich per E-Mail${d ? ` zu ${d}` : ""}.`,
    yourEmail: "Ihre E-Mail",
    sending: "Wird gesendet…",
    sendFixes: "Liste anfordern",
    leadSmallPrint: "Freiwillig. Ich nutze Ihre E-Mail nur, um Ihnen zu antworten; sie wird nach 12 Monaten gelöscht.",
    privacyPolicy: "Datenschutzerklärung",
    or: "oder",
    messageMeLower: "schreiben Sie mir auf LinkedIn",
    somethingWrong: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
    disclaimer: (d, n, c) =>
      `Dieser Bericht wurde automatisch mit KI (Google Gemini) erstellt, nur auf Grundlage der öffentlichen Website von ${d}${c.length ? ` und von ${join(c, "und")}` : ""} sowie Messungen von Google PageSpeed. Er kann Fehler enthalten und ist keine professionelle Beratung. Growth Audit AI ist ein unabhängiges Projekt und steht in keiner Verbindung zu ${n}${c.length ? " oder den verglichenen Unternehmen" : ""}. Firmennamen und Logos gehören ihren Inhabern und dienen nur der Identifizierung der analysierten Websites.`,
    compareTitle: "Vergleich mit Wettbewerbern",
    compareSubtitle: "Dieselben sechs Bereiche, für jede Website gleich bewertet. Wer wo vorne liegt, berechnet der Code.",
    overall: "Gesamt",
    thisSite: "diese Website",
    leads: (a) => `Vor allen Wettbewerbern bei ${a}.`,
    trails: (a, r) => `Hinter ${r} bei ${a}.`,
    compareFailed: (d) => `${d} konnte nicht geprüft werden und wird daher weggelassen.`,
    benchmark: (a, t) => `Durchschnitt aus ${t} geprüften Websites: ${a}`,
    betterThan: (p) => `besser als ${p} %`,
    badgeTitle: (g) => `Ein Ergebnis zum Zeigen: ${g}`,
    badgeText: "Binden Sie dieses Abzeichen auf Ihrer Website ein. Es verlinkt auf diesen Bericht, damit Besucher die Details sehen.",
    copyCode: "Code kopieren",
    codeCopied: "Code kopiert",
    badgeAlt: (s) => `Wachstums-Score ${s}/100`,
    outreach: {
      title: "Dieses Unternehmen ansprechen",
      subtitle: "Versandfertige erste Nachrichten, nur aus diesem Bericht: Jedes Ergebnis und jede Zahl stammt aus dem Audit. Von KI auf Anfrage geschrieben; vor dem Senden bitte prüfen.",
      yourName: "Ihr Name",
      yourCompany: "Ihr Unternehmen",
      yourOffer: "Ihr Angebot",
      offerPlaceholder: "z. B. SEO, Marketing-Automatisierung, Anzeigen",
      contactName: "Vorname des Kontakts",
      create: "Nachrichten schreiben",
      creating: "Wird geschrieben…",
      again: "Neue Versionen schreiben",
      findings: "Grundlage sind diese Ergebnisse",
      bestContact: (r) => `Beste Ansprechperson: ${r}`,
      roles: { marketing: "Marketingleitung oder Gründer:in", growth: "Growth- oder Marketingleitung", founder: "Gründer:in oder Geschäftsführung" },
      searchWord: { marketing: "Marketing", growth: "Growth", founder: "Gründer" },
      companyPage: "Unternehmensseite öffnen",
      findPerson: "Passende Person auf LinkedIn finden",
      connectionNote: "LinkedIn-Kontaktanfrage",
      followUp: "LinkedIn-Nachricht nach der Annahme",
      email: "E-Mail-Version",
      emailNote: "In Deutschland, Spanien und großen Teilen der EU brauchen Werbe-E-Mails eine vorherige Einwilligung, auch zwischen Unternehmen. Nutzen Sie diese Version für bestehende Kontakte und Personen, die Informationen angefragt haben; für Unbekannte LinkedIn.",
      subject: "Betreff",
      openers: "Andere Einstiege",
      style: { curiosity: "Neugier", number: "Zahl", compliment: "Stärke zuerst" },
      chars: (n, m) => `${n}/${m} Zeichen`,
      copy: "Kopieren",
      error: "Die Nachrichten konnten nicht geschrieben werden. Bitte erneut versuchen.",
    },
  },
};

export function joinList(items: string[], lang: Lang): string {
  return join(items, lang === "es" ? "y" : lang === "de" ? "und" : "and");
}
