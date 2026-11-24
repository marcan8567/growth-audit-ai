export type PageKind = "home" | "about" | "pricing" | "product" | "blog";

export interface Heading {
  level: 1 | 2 | 3;
  text: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface PageData {
  kind: PageKind;
  url: string;
  title: string;
  metaDescription: string;
  headings: Heading[];
  ctas: string[];
  text: string;
  wordCount: number;
}

export interface WebsiteData {
  inputUrl: string;
  finalUrl: string;
  domain: string;
  fetchedAt: string;
  pages: PageData[];
  socialLinks: SocialLink[];
  failedPages: { kind: PageKind; url: string; error: string }[];
}
