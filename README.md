# Growth Audit AI

Enter any company URL and get a brand voice profile, a scored growth audit, a 14-day content pack and an automation plan, all built from the company's own public website.

> Status: Milestones 1–3 done (website reader, brand voice, growth audit, content pack, automation plan, report page). Next: saved, shareable reports and per-visitor rate limiting (Upstash Redis), then a proper landing page.

## How it works

1. **Read website + checks**: fetches the homepage plus up to 4 key pages (about, pricing, product, blog) and extracts the title, meta description, headings, calls to action, social links and clean text. Ten website checks (HTTPS, title length, meta description, one H1, CTAs, pricing page, blog, social links…) are then measured in code. No AI in this step.
2. **Brand voice, growth audit, automation plan** run in parallel:
   - **Brand voice**: tone, audience, positioning, key messages, with supporting quotes.
   - **Growth audit**: the AI scores six areas from 0 to 10 and suggests quick wins; code calculates the overall score.
   - **Automation plan**: 4–6 practical marketing automations with trigger, steps, tools and the role of AI.
3. **14-day content pack** starts as soon as the brand voice is ready, because it writes in that voice.

Every AI answer must match a Zod schema. If it doesn't, the AI is told the exact problem and asked once more. A grounding check then confirms that each quote really appears on the website. If one step fails, the rest of the report still appears.

## Tech stack

Next.js (App Router, TypeScript) · Tailwind CSS · Anthropic TypeScript SDK (Claude) or Google Gen AI SDK (Gemini), switchable with `AI_PROVIDER` · Zod · Cheerio · Vercel

## Run it locally

```bash
npm install
cp .env.example .env.local   # then add ANTHROPIC_API_KEY, or set AI_PROVIDER=gemini and add GEMINI_API_KEY
npm run dev
```

Open http://localhost:3000/test.

## Project structure

```
app/
  api/audit/route.ts      runs the pipeline and streams progress events (NDJSON) to the page
  test/page.tsx           report page: URL in, live steps, full report out
lib/
  reader/                 website reader (URL safety, fetch, extract, key pages) + code checks
  ai/                     provider switch (Claude/Gemini) + runJsonStep (validate, retry once)
  schemas/                Zod schemas, one per AI step
  steps/                  one file per pipeline step, plus the shared grounding check
prompts/                  prompts, kept separate so they're easy to improve
```

## Privacy

The tool reads public website content only and stores no personal data.
