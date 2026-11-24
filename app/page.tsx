import Link from "next/link";
import { SITE } from "@/lib/site";
import { listRecentAudits, loadReport, type RecentAudit, type SavedReport } from "@/lib/store/reports";

// The sample report is read from Redis on each visit (one small, fast read; well within Upstash's free tier).
export const dynamic = "force-dynamic";

export default async function Home() {
  const [sample, recent] = await Promise.all([
    loadReport(SITE.sampleReportId).catch(() => null),
    // Only audits run with the access code are listed; visitors' reports stay private.
    listRecentAudits(3, [SITE.sampleReportId]).catch(() => [] as RecentAudit[]),
  ]);
  const sampleHref = `/r/${SITE.sampleReportId}`;

  return (
    <div className="bg-white text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Growth Audit AI
        </Link>
        <nav className="flex gap-6 text-sm font-medium text-ink-soft">
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
              In about a minute: scores for six growth areas, Google speed data, the brand voice, two ready-to-post
              social media posts and a marketing automation plan. Built only from what is on the company&apos;s public
              website.
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
              <p className="mt-3 text-sm text-ink-soft">Free for 3 websites a day. No sign-up.</p>
            </form>
          </div>

          <div className="lg:col-span-5">
            {sample ? <SampleScorecard report={sample} href={sampleHref} /> : null}
          </div>
        </section>

        {recent.length > 0 && <RecentAudits audits={recent} />}

        {/* What the report contains. Not a sequence, so no numbers. */}
        <section className="bg-mist">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="text-3xl font-bold tracking-tight">What the report covers</h2>
            <dl className="mt-10 grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {COVERS.map((item) => (
                <div key={item.term}>
                  <dt className="text-lg font-semibold">{item.term}</dt>
                  <dd className="mt-1.5 leading-relaxed text-ink-soft">{item.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* How it works. This is an actual sequence, so it is numbered. */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
          <p className="mt-3 max-w-[60ch] leading-relaxed text-ink-soft">
            Code handles facts and maths, the AI handles judgement and writing, and every AI answer is checked
            before it reaches the report.
          </p>
          <ol className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="border-t-2 border-ink pt-4">
                <span className="text-sm font-semibold text-ink-soft">{i + 1}</span>
                <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
                <p className="mt-1.5 leading-relaxed text-ink-soft">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

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

      <footer className="border-t border-mist">
        <p className="mx-auto max-w-6xl px-6 py-8 text-sm text-ink-soft">
          Reads public website content only. Shared reports are kept for six months.
        </p>
      </footer>
    </div>
  );
}

/** The newest audits run with the access code, each linking to its full report. */
function RecentAudits({ audits }: { audits: RecentAudit[] }) {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <h2 className="text-2xl font-bold tracking-tight">Recent audits</h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-3">
        {audits.map((a) => (
          <li key={a.id}>
            <Link
              href={`/r/${a.id}`}
              className="group block rounded-xl border border-ink/15 p-5 hover:border-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-marker"
            >
              <p className="truncate text-lg font-semibold group-hover:underline">{a.domain}</p>
              <p className="mt-3">
                <span className={`text-4xl font-bold tracking-tight ${scoreText(a.score / 10)}`}>{a.score}</span>
                <span className="text-ink-soft">/100</span>
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                {a.grade}, {timeAgo(a.createdAt)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** "2 hours ago", "yesterday", "3 days ago", or the date for anything older than a month. */
function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 60) return minutes <= 1 ? "just now" : `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "an hour ago" : `${hours} hours ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return days === 1 ? "yesterday" : `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** A real saved report, shown as a printed scorecard with the key finding marked in highlighter. */
function SampleScorecard({ report, href }: { report: SavedReport; href: string }) {
  const audit = report.audit;
  if (!audit || !report.site) return null;

  return (
    <figure className="rounded-xl border border-ink/15 bg-white p-6 shadow-[0_1px_0_rgba(23,32,51,0.08),0_20px_40px_-24px_rgba(23,32,51,0.35)] sm:p-8">
      <figcaption className="text-sm text-ink-soft">Sample report</figcaption>
      <div className="mt-2 flex items-baseline justify-between gap-4">
        <p className="text-2xl font-bold tracking-tight">{report.site.domain}</p>
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
        <p className="text-sm font-semibold">Biggest opportunity</p>
        <p className="mt-1.5 leading-relaxed">
          <span className="marker">{audit.biggestOpportunity}</span>
        </p>
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
    text: "Six areas scored from 0 to 10, from messaging to social proof, each backed by quotes from the site. Every quote is checked word for word.",
  },
  {
    term: "Speed and mobile",
    text: "Google PageSpeed measures how fast the site loads on phones, using real visitor data where Google has it.",
  },
  {
    term: "Brand voice",
    text: "Tone, audience, positioning and the words the company uses, so new content sounds like them.",
  },
  {
    term: "Posts to publish",
    text: "A short post for LinkedIn and one for X, in the brand's voice and ready to copy. Want a full content plan? Get in touch on LinkedIn.",
  },
  {
    term: "Automation plan",
    text: "Four to six marketing workflows with what starts them, the steps, the tools and where AI helps.",
  },
  {
    term: "A link to share",
    text: "Every report gets its own page, so you can send it to a colleague or a client.",
  },
];

const STEPS = [
  {
    title: "Read",
    text: "Fetches the homepage and up to four key pages, then runs ten checks in code: titles, headings, calls to action and more.",
  },
  {
    title: "Measure",
    text: "Google PageSpeed tests the homepage on a mobile phone at the same time.",
  },
  {
    title: "Judge",
    text: "The AI writes the brand voice, the scores, two social media posts and the automation plan, in parallel where it can.",
  },
  {
    title: "Verify",
    text: "Each answer must match a strict format, or the AI is told what is wrong and tries once more. Quotes are checked against the site.",
  },
];

const scoreText = (score10: number) =>
  score10 >= 7 ? "text-emerald-700" : score10 >= 4.5 ? "text-amber-600" : "text-red-600";
const scoreBar = (score10: number) => (score10 >= 7 ? "bg-emerald-500" : score10 >= 4.5 ? "bg-amber-400" : "bg-red-500");
