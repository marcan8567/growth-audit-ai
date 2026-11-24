/** Details about the project shown on the homepage. Change them here. */
export const SITE = {
  author: "Marc Cantacuzene",
  repoUrl: "https://github.com/marcan8567/growth-audit-ai",
  docsUrl: "https://github.com/marcan8567/growth-audit-ai/blob/main/docs/HOW-IT-WORKS.md",
  /** Where visitors ask for the full content plan. The call to action is hidden while this is empty. */
  linkedinUrl: "https://www.linkedin.com/in/marc-cantacuzene/",
  /** The saved report shown as the homepage sample (set to never expire in Redis). */
  sampleReportId: process.env.SAMPLE_REPORT_ID || "FEohezETg8",

  /**
   * Details for the Impressum (§ 5 DDG) and the privacy policy. The two pages and their footer links
   * only appear once street, city and email are filled in, so an incomplete notice is never published.
   * The address must be one where post can be delivered and legal documents served (a c/o address
   * service is common for people who don't want to publish their home address).
   */
  legal: {
    name: "Marc Cantacuzene",
    street: "",
    city: "", // postcode and town, e.g. "10115 Berlin"
    email: "",
  },
};

/** True when the legal details are complete, so the Impressum and privacy policy can be shown. */
export const LEGAL_READY = Boolean(SITE.legal.street && SITE.legal.city && SITE.legal.email);
