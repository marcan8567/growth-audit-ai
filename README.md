# Growth Audit AI

Enter any company URL and get a brand voice profile, a scored growth audit, a 14-day content pack and an automation plan, all built from the company's own public website.

> Status: Milestones 1–2 done (website reader + brand voice). Audit, content pack, automation plan and the report page are next.

## How it works

1. **Read website**: fetches the homepage plus up to 4 key pages (about, pricing, product, blog), then extracts the title, meta description, headings, calls to action, social links and clean text. This is plain code, with no AI.
2. **Brand voice**: Claude turns the website text into a structured profile covering tone, audience, positioning, key messages and supporting quotes.
3. **Growth audit, content pack, automation plan**: these run in parallel after step 2 (coming next).

Every AI answer must match a Zod schema. If it doesn't, Claude is told the exact problem and asked once more. A grounding check then confirms that each quote really appears on the website.

## Tech stack

Next.js (App Router, TypeScript) · Tailwind CSS · Anthropic TypeScript SDK (Claude) or Google Gen AI SDK (Gemini), switchable with `AI_PROVIDER` · Zod · Cheerio · Upstash Redis · Vercel

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
  api/brand-voice-test/route.ts   streams progress events (NDJSON) to the page
  test/page.tsx                   test page: URL in, live steps, JSON out
lib/
  reader/                         website reader: URL safety, fetch, extract, key pages
  ai/                             provider switch (Claude/Gemini) + runJsonStep (validate, retry once)
  schemas/                        Zod schemas, one per AI step
  steps/                          one file per pipeline step
prompts/                          prompts, kept separate so they're easy to improve
```

## Privacy

The tool reads public website content only and stores no personal data.
