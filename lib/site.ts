/** Details about the project shown on the homepage. Change them here. */
export const SITE = {
  author: "Marc Cantacuzene",
  repoUrl: "https://github.com/marcan8567/growth-audit-ai",
  docsUrl: "https://github.com/marcan8567/growth-audit-ai/blob/main/docs/HOW-IT-WORKS.md",
  /** Where visitors ask for the full content plan. The call to action is hidden while this is empty. */
  linkedinUrl: "https://www.linkedin.com/in/marc-cantacuzene/",
  /** The fictional company used for the sample report and demo video (repo: marcan8567/stryon-labs). */
  demoSiteDomain: "stryon-labs.vercel.app",
  /** The saved report shown as the homepage sample: an audit of the demo site (saved with the access code, so it never expires). */
  sampleReportId: process.env.SAMPLE_REPORT_ID || "FEohezETg8",

  /**
   * Details for the legal notice (Aviso legal, Art. 10 LSSI-CE) and the privacy policy, under Spanish law.
   * The two pages and their footer links only appear once street, city and email are filled in, so an
   * incomplete notice is never published. The address must be one where post and legal documents can be delivered.
   */
  legal: {
    name: "Marc Cantacuzene",
    street: "Plaza de Miquel Dolç 5",
    city: "07008 Palma de Mallorca", // postcode and town
    country: { local: "España", english: "Spain" },
    email: "growthauditai@gmail.com",
    /** NIF or NIE: expected by LSSI-CE for anyone offering services online. Shown when filled in. */
    taxId: "Z0773325R",
  },
};

/** True when the legal details are complete, so the legal notice and privacy policy can be shown. */
export const LEGAL_READY = Boolean(SITE.legal.street && SITE.legal.city && SITE.legal.email);

/**
 * Quotes for the homepage's "What people say" section, which stays hidden while this list is empty.
 * Only real quotes, and only with the person's permission to show their name. For example:
 * { quote: "The quick wins were spot on.", name: "Ana López", role: "Head of Marketing", company: "Acme" }
 */
export const TESTIMONIALS: { quote: string; name: string; role: string; company?: string }[] = [];
