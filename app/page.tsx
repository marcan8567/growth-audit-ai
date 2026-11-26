import Link from "next/link";
import { SITE } from "@/lib/site";
import { getAuditOverview, loadReport, type AuditOverview, type SavedReport } from "@/lib/store/reports";
import { track } from "@/lib/store/stats";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { ContactCta } from "@/components/contact-cta";
import { LangPicker } from "@/components/lang-picker";
import { CompetitorFields } from "@/components/competitor-fields";
import { Testimonials } from "@/components/testimonials";

// The sample report is read from Redis on each visit (one small, fast read; well within Upstash's free tier).
export const dynamic = "force-dynamic";

export default async function Home() {
  // The sample is an audit of Stryon Labs, a fictional agency built for this demo, so no real company is judged.
  const [sample, overview] = await Promise.all([
    loadReport(SITE.sampleReportId).catch(() => null),
    // How many websites were audited, and the newest results without their names.
    getAuditOverview().catch((): AuditOverview => ({ total: 0, averageScore: null, recent: [] })),
    // Funnel count, done alongside so it doesn't slow the page down.
    track("home_view"),
  ]);
  const sampleHref = `/r/${SITE.sampleReportId}`;

  return (
    <div className="bg-white text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6">
        <Link href="/" aria-label="Growth Audit AI, home" className="rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-marker">
          <Logo />
        </Link>
        <nav className="flex items-center gap-4 whitespace-nowrap text-sm font-medium text-ink-soft sm:gap-6">
          {sample && (
            <Link href={sampleHref} className="hover:text-ink">
              Sample report
            </Link>
          )}
          <a href={SITE.repoUrl} className="hover:text-ink">
            GitHub
          </a>
        </nav>
      </header>

      <main>
        {/* Hero: what it is, the way to try it, and a real result next to it. */}
        <section className="mx-auto grid max-w-6xl gap-14 px-6 pb-20 pt-10 lg:grid-cols-12 lg:gap-10 lg:pt-16">
          <div className="lg:col-span-7">
            <h1 className="text-5xl font-bold leading-[1.02] tracking-[-0.03em] sm:text-6xl xl:text-[4.25rem]">
              <span className="block text-balance">Paste a website.</span>
              <span className="block text-balance">Get its growth audit.</span>
            </h1>
            <p className="mt-6 max-w-[56ch] text-lg leading-relaxed text-ink-soft">
              In about a minute: scores for six growth areas, Google speed data, keywords, the brand voice, two
              ready-to-post social media posts and a marketing automation plan. Optionally compared with up to two
              competitors, in English, Spanish or German.
            </p>

            <form action="/audit" method="get" className="mt-10 max-w-xl">
              <label htmlFor="url" className="mb-2 block text-sm font-medium">
                Company website
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex flex-1 items-center rounded-lg border-2 border-ink bg-white focus-within:ring-4 focus-within:ring-marker">
                  <span className="pl-4 text-ink-soft" aria-hidden="true">
                    https://
                  </span>
                  <input
                    id="url"
                    name="url"
                    required
                    placeholder="company.com"
                    autoComplete="url"
                    inputMode="url"
                    className="w-full bg-transparent px-1 py-3.5 text-lg outline-none"
                  />
                </div>
                <button className="rounded-lg bg-ink px-6 py-3.5 text-lg font-semibold text-white hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-marker">
                  Run audit
                </button>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                <LangPicker />
                <CompetitorFields />
              </div>
              <p className="mt-3 text-sm text-ink-soft">Free for 3 websites a day. No sign-up.</p>
            </form>
            {SITE.demoVideoUrl && (
              <a
                href={SITE.demoVideoUrl}
                target="_blank"
                rel="noreferrer"
                className="group mt-8 inline-flex items-center gap-3 rounded-full py-1 pr-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-marker"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-marker text-ink transition-transform group-hover:scale-110 motion-reduce:transition-none">
                  <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4" fill="currentColor" aria-hidden="true">
                    <path d="M8 5.5v13l11-6.5z" />
                  </svg>
                </span>
                <span className="underline-offset-4 group-hover:underline">Watch the 2-minute demo</span>
              </a>
            )}
          </div>

          <div className="lg:col-span-5">
            {sample ? <SampleScorecard report={sample} href={sampleHref} /> : null}
          </div>
        </section>


        {overview.total >= 10 && <AuditsSoFar overview={overview} />}

        {/* What the report contains. Not a sequence, so no numbers. */}
        <section className="bg-mist">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="text-3xl font-bold tracking-tight">What the report covers</h2>
            <dl className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {COVERS.map((item) => (
                <div key={item.term} className="rounded-2xl border border-ink/5 bg-white p-6 shadow-[0_1px_2px_rgba(23,32,51,0.04)]">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-marker text-ink" aria-hidden="true">
                    <CoverIcon name={item.icon} />
                  </span>
                  <dt className="mt-4 text-lg font-semibold">{item.term}</dt>
                  <dd className="mt-1.5 leading-relaxed text-ink-soft">{item.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* How it works. This is an actual sequence, so it is numbered. */}
        <section className="bg-ink text-white">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
            <p className="mt-3 max-w-[60ch] leading-relaxed text-white/70">
              Code handles facts and maths, the AI handles judgement and writing, and every AI answer is checked
              before it reaches the report. About a minute from address to report.
            </p>
            <ol className="relative mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {STEPS.map((step, i) => (
                <li key={step.title} className="relative">
                  {/* On wide screens a line joins each step to the next, turning yellow into the last one */}
                  {i < STEPS.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={`absolute left-16 -right-4 top-6 hidden h-0.5 rounded-full lg:block ${
                        i === STEPS.length - 2 ? "bg-gradient-to-r from-white/25 to-marker" : "bg-white/25"
                      }`}
                    />
                  )}
                  <span
                    className={`relative flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ring-8 ring-ink ${
                      i === STEPS.length - 1 ? "bg-marker text-ink" : "bg-white text-ink"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="mt-5 flex items-center gap-2">
                    <h3 className="text-xl font-semibold">{step.title}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${step.by === "AI" ? "bg-marker text-ink" : "bg-white/10 text-white/80"}`}>
                      {step.by}
                    </span>
                  </div>
                  <p className="mt-2 leading-relaxed text-white/70">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <Testimonials />
        <ContactCta />

        {/* For interviewers and anyone curious about the build. */}
        <section className="border-t border-mist">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-20 lg:grid-cols-12">
            <h2 className="text-3xl font-bold tracking-tight lg:col-span-4">About this project</h2>
            <div className="lg:col-span-8">
              <p className="max-w-[62ch] text-lg leading-relaxed">
                Growth Audit AI is a portfolio project by {SITE.author}, built to show growth marketing and AI
                automation working together, from the first website request to a report you can share.
              </p>
              <p className="mt-4 max-w-[62ch] leading-relaxed text-ink-soft">
                Built with Next.js and TypeScript on Vercel. The AI steps run on Gemini or Claude (switchable), every
                answer is validated with Zod, speed data comes from the Google PageSpeed Insights API, and reports and
                rate limits are stored in Upstash Redis.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href={SITE.repoUrl}
                  className="rounded-lg border-2 border-ink px-5 py-2.5 font-semibold hover:bg-ink hover:text-white"
                >
                  Read the code
                </a>
                <a href={SITE.docsUrl} className="rounded-lg px-5 py-2.5 font-semibold underline underline-offset-4">
                  How it&apos;s built
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

/**
 * Social proof without exposing anyone: a live count of audits, their average score, and the three
 * newest results with the website left out. Shown once there are at least 10 audits.
 */
function AuditsSoFar({ overview }: { overview: AuditOverview }) {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <div className="relative overflow-hidden rounded-3xl bg-ink p-8 text-white sm:p-10">
        <div className="relative grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="grid grid-cols-2 gap-8 lg:col-span-4">
            <div>
              <p className="text-6xl font-bold tracking-tight tabular-nums">{overview.total}</p>
              <div className="mt-3 h-1 w-10 rounded-full bg-marker" />
              <p className="mt-2 text-sm text-white/60">websites audited</p>
            </div>
            {overview.averageScore !== null && (
              <div>
                <p className="text-6xl font-bold tracking-tight tabular-nums">
                  {overview.averageScore}
                  <span className="text-xl font-semibold text-white/50">/100</span>
                </p>
                <div className="mt-3 h-1 w-full max-w-[8rem] rounded-full bg-white/15">
                  <div className="h-1 rounded-full bg-marker" style={{ width: `${overview.averageScore}%` }} />
                </div>
                <p className="mt-2 text-sm text-white/60">average score</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-8">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <span aria-hidden="true" className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-marker opacity-60 motion-reduce:animate-none" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-marker" />
              </span>
              Latest audits
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {overview.recent.map((a) => (
                <li key={a.createdAt} className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
                  <div className="flex items-baseline justify-between gap-2">
                    <p>
                      <span className="text-4xl font-bold tracking-tight tabular-nums">{a.score}</span>
                      <span className="text-sm text-white/50">/100</span>
                    </p>
                    <span className="text-xs text-white/50">{timeAgo(a.createdAt)}</span>
                  </div>
                  <div className="mt-3 h-1 rounded-full bg-white/10">
                    <div className="h-1 rounded-full bg-marker" style={{ width: `${a.score}%` }} />
                  </div>
                  {a.weakest && (
                    <div className="mt-4">
                      <p className="text-xs text-white/50">Weakest area</p>
                      <p className="mt-1.5 rounded-xl bg-marker px-3 py-1.5 text-center text-xs font-semibold leading-snug text-ink">{a.weakest}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-white/50">Websites are not shown: every report stays private to whoever has its link.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/** "2 hours ago", "yesterday", "3 days ago", or the date for anything older than a month. */
function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 60) return minutes <= 1 ? "just now" : `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return days === 1 ? "yesterday" : `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** The sample report (a real audit of a fictional company), shown as a scorecard with the key finding. */
function SampleScorecard({ report, href }: { report: SavedReport; href: string }) {
  const audit = report.audit;
  if (!audit || !report.site) return null;

  return (
    <figure className="rounded-xl border border-ink/15 bg-white p-6 shadow-[0_1px_0_rgba(23,32,51,0.08),0_20px_40px_-24px_rgba(23,32,51,0.35)] sm:p-8">
      <figcaption className="text-sm text-ink-soft">Sample report</figcaption>
      <div className="mt-2 flex items-baseline justify-between gap-4">
        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-tight">{report.site.brand?.name ?? report.site.domain}</p>
          <p className="mt-0.5 text-sm text-ink-soft">
            A fictional AI agency{" "}
            <a href={`https://${report.site.domain}`} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-ink">
              we built for this demo
            </a>
          </p>
        </div>
        <p className="shrink-0 text-right">
          <span className={`text-5xl font-bold tracking-tight ${scoreText(audit.overallScore / 10)}`}>
            {audit.overallScore}
          </span>
          <span className="text-ink-soft">/100</span>
        </p>
      </div>

      <ul className="mt-6 flex flex-col gap-3">
        {audit.categories.map((c, i) => (
          <li key={c.id}>
            <div className="flex justify-between text-sm">
              <span>{c.label}</span>
              <span className="font-semibold">{c.score}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-mist">
              <div
                className={`fill-bar h-1.5 rounded-full ${scoreBar(c.score)}`}
                style={{ width: `${c.score * 10}%`, animationDelay: `${150 + i * 70}ms` }}
              />
            </div>
          </li>
        ))}
      </ul>

      <blockquote className="mt-7 border-t border-mist pt-5">
        <div className="border-l-4 border-marker pl-4">
          <p className="text-sm font-semibold">Biggest opportunity</p>
          <p className="mt-1.5 font-medium leading-relaxed">{audit.biggestOpportunity}</p>
        </div>
      </blockquote>

      <Link href={href} className="mt-6 inline-block font-semibold underline underline-offset-4 hover:no-underline">
        Open the full sample report
      </Link>
    </figure>
  );
}

const COVERS = [
  {
    term: "Growth score",
    icon: "score",
    text: "Six areas scored from 0 to 10, from messaging to social proof, each backed by quotes from the site. Every quote is checked word for word.",
  },
  {
    term: "Speed and mobile",
    icon: "speed",
    text: "Google PageSpeed measures how fast the site loads on phones, using real visitor data where Google has it.",
  },
  {
    term: "Keywords",
    icon: "search",
    text: "The search phrases the site is built around, where each one appears (checked in code), and five worth adding next.",
  },
  {
    term: "Brand voice",
    icon: "voice",
    text: "Tone, audience, positioning and the words the company uses, so new content sounds like them.",
  },
  {
    term: "Posts to publish",
    icon: "post",
    text: "A short post for LinkedIn and one for X, in the brand's voice and ready to copy. Want a full content plan? Get in touch on LinkedIn.",
  },
  {
    term: "Automation plan",
    icon: "flow",
    text: "The three marketing workflows most worth automating, with what starts them, the steps, the tools and where AI helps.",
  },
  {
    term: "Competitor comparison",
    icon: "compare",
    text: "Optional: add up to two competitors and see the six areas side by side, with who leads where.",
  },
  {
    term: "In your language",
    icon: "globe",
    text: "The whole report in English, Spanish or German. Quotes stay in the website's own words, so they can still be checked.",
  },
  {
    term: "Share it or save it",
    icon: "link",
    text: "Every report gets its own page to send to a colleague or a client, and saves as a clean PDF.",
  },
] as const;

/** Line icons for "What the report covers", drawn in the logo's ink on a yellow tile. */
function CoverIcon({ name }: { name: (typeof COVERS)[number]["icon"] }) {
  const paths: Record<typeof name, React.ReactNode> = {
    search: (
      <>
        <circle cx="11" cy="11" r="6" />
        <path d="m20 20-4.5-4.5" />
      </>
    ),
    compare: (
      <>
        <path d="M5 20V10M10 20V5M15 20v-8M20 20v-5" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.3 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.3-3.5-8.5s1.1-6.1 3.5-8.5z" />
      </>
    ),
    score: (
      <>
        <path d="M12 3a9 9 0 1 0 9 9" />
        <path d="M12 3a9 9 0 0 1 9 9" strokeDasharray="3 3" />
        <path d="M8 13l3 3 5-6" />
      </>
    ),
    speed: (
      <>
        <path d="M4 15a8 8 0 1 1 16 0" />
        <path d="M12 15l4-5" />
        <circle cx="12" cy="15" r="1.2" fill="currentColor" />
      </>
    ),
    voice: (
      <>
        <path d="M4 5h16v10H9l-5 4z" />
        <path d="M8 9h8M8 12h5" />
      </>
    ),
    post: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M8 9h8M8 13h8M8 17h4" />
      </>
    ),
    flow: (
      <>
        <rect x="3" y="4" width="6" height="5" rx="1.5" />
        <rect x="15" y="15" width="6" height="5" rx="1.5" />
        <path d="M6 9v4a2 2 0 0 0 2 2h7" />
        <path d="M13 13l2 2-2 2" />
      </>
    ),
    link: (
      <>
        <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
        <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

const STEPS = [
  {
    title: "Read",
    by: "Code",
    text: "Fetches the homepage and up to four key pages, then runs ten checks in code: titles, headings, calls to action and more.",
  },
  {
    title: "Measure",
    by: "Google",
    text: "Google PageSpeed tests the homepage on a mobile phone at the same time.",
  },
  {
    title: "Judge",
    by: "AI",
    text: "The AI writes the brand voice, the scores, two social media posts and the automation plan, in parallel where it can.",
  },
  {
    title: "Verify",
    by: "Code",
    text: "Each answer must match a strict format, or the AI is told what is wrong and tries once more. Quotes are checked against the site.",
  },
];

const scoreText = (score10: number) =>
  score10 >= 7 ? "text-emerald-700" : score10 >= 4.5 ? "text-amber-600" : "text-red-600";
const scoreBar = (score10: number) => (score10 >= 7 ? "bg-emerald-500" : score10 >= 4.5 ? "bg-amber-400" : "bg-red-500");
