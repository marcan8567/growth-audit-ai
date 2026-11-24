# Growth Audit AI

Enter any company URL and get a scored growth audit, Google speed data, a brand voice profile, ready-to-post LinkedIn and X posts and an automation plan, all built from the company's own public website. Visitors who want a full content plan are invited to get in touch on LinkedIn.

> Status: complete for now: landing page, website reader, Google speed and mobile data, brand voice, growth audit, LinkedIn and X posts with a call to action, automation plan, saved shareable reports and rate limits.
>
> Live: https://growth-audit-ai.vercel.app

## How it works

0. **Speed and mobile**: Google PageSpeed Insights measures the homepage on a mobile phone (performance, SEO, accessibility, best practices) and adds real Chrome-user data where Google has it. It starts at once, because it takes 15–45 seconds.
1. **Read website + checks**: fetches the homepage plus up to 4 key pages (about, pricing, product, blog) and extracts the title, meta description, headings, calls to action, social links and clean text. Ten website checks (HTTPS, title length, meta description, one H1, CTAs, pricing page, blog, social links…) are then measured in code. No AI in this step.
2. **Brand voice, growth audit, automation plan** run in parallel:
   - **Brand voice**: tone, audience, positioning, key messages, with supporting quotes.
   - **Growth audit** (waits for the speed data): the AI scores six areas from 0 to 10 and suggests quick wins; code calculates the overall score.
   - **Automation plan**: 4–6 practical marketing automations with trigger, steps, tools and the role of AI.
3. **Social media post** starts as soon as the brand voice is ready, because it writes in that voice: three content themes and two short ready-to-post posts, one for LinkedIn and one for X, shown side by side as they would look in each feed with the company's own name, logo and colour. A call to action offers the full content plan via LinkedIn.
4. **Save**: the finished report is stored in Upstash Redis and gets its own link (`/r/<id>`), kept for 6 months. Audits run with the access code are kept for good and shown as "Recent audits" on the homepage; visitors' reports are never listed.

Anyone can run 3 free audits a day (15 a day across the whole site). The access code removes the limits.

Every AI answer must match a Zod schema. If it doesn't, the AI is told the exact problem and asked once more. A grounding check then confirms that each quote really appears on the website. If one step fails, the rest of the report still appears.

## Tech stack

Next.js (App Router, TypeScript) · Tailwind CSS · Anthropic TypeScript SDK (Claude) or Google Gen AI SDK (Gemini 3.8 Flash + 3.1 Flash-Lite), switchable with `AI_PROVIDER` · Zod · Cheerio · Google PageSpeed Insights API · Upstash Redis + Ratelimit · Vercel

## Run it locally

```bash
npm install
cp .env.example .env.local   # then add ANTHROPIC_API_KEY, or set AI_PROVIDER=gemini and add GEMINI_API_KEY
npm run dev
```

Open http://localhost:3000 (or go straight to http://localhost:3000/audit).

## Project structure

```
app/
  api/audit/route.ts      runs the pipeline and streams progress events (NDJSON) to the page
  page.tsx                landing page with a live sample report
  audit/page.tsx          audit page: URL in, live steps, full report out, share link (/test redirects here)
  r/[id]/page.tsx         a saved report, opened from its share link
components/
  report.tsx              the report itself, shared by both pages
lib/
  reader/                 website reader (URL safety, fetch, extract, key pages), code checks, Google PageSpeed
  ai/                     provider switch (Claude/Gemini) + runJsonStep (validate, retry once)
  schemas/                Zod schemas, one per AI step
  steps/                  one file per pipeline step, plus the shared grounding check
  store/                  Upstash Redis: saved reports and rate limits
  site.ts                 author, links (GitHub, LinkedIn) and the sample report shown on the homepage
prompts/                  prompts, kept separate so they're easy to improve
```

## Privacy

The tool reads public website content only. Saved reports contain only what was found on that public website. Visitors are counted for the daily limit by a one-way hash of their IP address, so no IP addresses are stored.
