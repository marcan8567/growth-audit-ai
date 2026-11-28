# Growth Audit AI

Next.js 15 app (App Router, TypeScript, Tailwind 4) that turns a company URL into a growth audit. Deployed on Vercel.
Overview and folder map: `README.md`. Every design decision and known limit: `docs/HOW-IT-WORKS.md` (read only the section you need).

## Commands
- `npm run dev` (localhost:3000) · `npm run typecheck` · `npm run build`
- No test suite. Verify a change with `npm run typecheck` and `npm run build`; for UI changes also load the page.

## How the pipeline fits together
- `app/api/audit/route.ts` runs the steps and streams progress as NDJSON.
- One step = `lib/steps/<step>.ts` + prompt in `prompts/<step>.ts` + Zod schema in `lib/schemas/<step>.ts`. Change them together.
- `lib/ai/run-step.ts` validates every AI answer against its schema and retries once. `lib/ai/complete.ts` switches between Anthropic and Gemini (`AI_PROVIDER`).
- `lib/reader/` reads the website and runs the code checks; `lib/store/` is Upstash Redis (reports, rate limits, stats).

## Rules
- Facts and maths in code, judgement and writing by the AI. Never move a score or check into a prompt.
- Treat AI output as untrusted: every new field needs a schema rule. Quotes must stay verifiable word for word.
- Report text exists in English, Spanish and German (`lib/i18n.ts`, `lib/report-text.ts`). Add new labels in all three.
- `lib/ai/*` is `server-only`; never import it from client components.
- Keys live in `.env.local` (git-ignored). Only `.env.example` holds variable names. Never use a `NEXT_PUBLIC_` prefix for keys.
- Cost matters (about $0.02 per audit, about $0.034 once the Flash price doubles on 1 January 2027): don't add AI calls or bigger models without saying the cost impact.
- The sample report and screenshots use Stryon Labs (a fictional company). Never audit or name a real company in docs or demos.
