# How it works: interview notes

Short explanations of each part, and the decision behind it, in the words you'd use in an interview.

## 1. Project setup

- **Next.js** gives one project for both the web page and the server code. Vercel deploys it straight from GitHub.
- **The API key lives only in environment variables** (`.env.local` locally, Vercel settings in production). `lib/ai/client.ts` imports `server-only`, so the build fails if anyone accidentally imports it into browser code.
- **`.env.example`** documents which keys are needed without exposing real ones.

## 2. The website reader (`lib/reader/`)

| File | What it does | Why it matters |
| --- | --- | --- |
| `url.ts` | Cleans the typed address and blocks local/private addresses | The server fetches whatever the visitor types, so without this someone could make it call internal systems (SSRF) |
| `fetch-page.ts` | Downloads one page with a timeout and size limit | A slow site can't use up the free-plan time budget |
| `extract.ts` | Uses Cheerio to pull out the title, meta, headings, CTAs, social links and clean text | These are exactly the things a marketer checks first. Menus and footers are removed so the AI reads the actual copy |
| `read-website.ts` | Reads the homepage, picks up to 4 key pages and fetches them in parallel | Parallel fetching is faster. A failed sub-page is recorded, not fatal |
| `format.ts` | Lays the content out for the AI and labels each page | Labelled pages let the AI say which page each quote came from |

**Talking point:** "Step 1 uses no AI at all. Plain code is cheaper, faster and always gives the same result, so I only use AI where judgement is needed."

## 3. The brand voice step

1. **Prompt** (`prompts/brand-voice.ts`): sets a role (a senior brand strategist), adds the shared grounding rules (`prompts/shared.ts`) and asks for one exact JSON format.
2. **Run + validate** (`lib/ai/run-step.ts`): calls Claude, removes any code fences, parses the JSON and checks it against the Zod schema. If anything is wrong, Claude is sent the exact problem (for example "tone: must contain exactly 3 items") and asked once more.
3. **Grounding check** (`lib/steps/brand-voice.ts`): every evidence quote is searched for, word for word, in the website text. The result reads "6 of 7 quotes verified".

**Talking point:** "AI output is treated as untrusted input. It gets validated like any other external data, and its claims get checked against the source."

## 4. Streaming progress (`app/api/audit/route.ts`)

The server sends one JSON line per event (`running`, `done`, `error`) as each step happens. The page reads the stream and shows each section of the report as soon as its step finishes.

**Why:** a full audit takes about a minute. Showing live progress makes the wait feel short. It also keeps the connection active instead of idle.

If the visitor closes the tab, the server stops sending and doesn't start AI steps that haven't begun yet, so nobody pays for a report no one will read.

## 5. Swappable AI provider (`lib/ai/complete.ts`)

`complete()` is the only function that talks to an AI provider. `AI_PROVIDER=anthropic` (default) calls Claude through the Anthropic SDK; `AI_PROVIDER=gemini` calls Gemini through Google's `@google/genai` SDK. Both return plain text plus a "was it cut off" flag, so JSON parsing, Zod validation, the retry and the grounding check are identical for both.

**Talking point:** "The pipeline doesn't trust any model's output, so swapping the model is a one-line config change. The same checks catch a bad answer from either provider."

## 6. The full pipeline (Milestone 3)

```
read website + 10 code checks ──┬── brand voice ──── content pack (14 days, in that voice)
                                ├── growth audit (6 scores + quick wins)
                                └── automation plan
```

| Decision | Why |
| --- | --- |
| **Website checks in code** (`lib/reader/checks.ts`): HTTPS, title and meta length, one H1, CTAs, pricing page, blog, socials… | These are facts, not opinions. Code gets them right every time, and the audit prompt tells the AI its scores must agree with them |
| **The AI scores six fixed categories; code calculates the overall score** (`lib/steps/growth-audit.ts`) | Language models are good at judgement and bad at arithmetic. The categories are fixed in code so every report has the same structure and can be compared |
| **Three steps in parallel, content pack after brand voice** | The audit and automation plan only need the website, so they run at the same time as brand voice. The content pack needs the brand voice to write in it. A full run takes about a minute instead of two |
| **Strict schemas with custom rules** (for example: exactly 14 posts covering days 1–14, every post's pillar must be one of the 3 pillars) | A rule the AI breaks becomes a precise retry message ("posts must cover days 1 to 14"), instead of a broken report |
| **Shared grounding check** (`lib/steps/grounding.ts`) | Brand voice and audit quotes are both verified word for word. On Stripe: 13 of 13 audit quotes verified |
| **One failed step doesn't kill the report** | Each step reports its own error and the rest still appear |
| **Retries are logged** (`console.warn` in `run-step.ts`, visible in Vercel → Logs) | Shows which prompts the AI struggles with, so they can be improved |

**Results on real sites:** Stripe scored 90/100 (Excellent) and Basecamp 62/100 (Average). Basecamp lost points for a very short homepage title, no linked social profiles and no blog in its navigation, which the code checks had also flagged.

**Talking point:** "I split the work by what each part is good at. Code does facts and maths, the AI does judgement and writing, and every AI answer is validated and fact-checked before it reaches the report."

## 7. Saved reports and rate limits (`lib/store/`)

| Decision | Why |
| --- | --- |
| **Upstash Redis** for storage | Serverless functions keep nothing between requests, so reports need an outside store. Upstash works over HTTP, has a free tier and needs no server |
| **Random 10-character report links** (`/r/ZC9XNQ-AUa`), hidden from search engines, deleted after 6 months | Only people you send a link to can find a report. Redis deletes old ones automatically, so storage never fills up |
| **Two limits**: 3 free audits per visitor per day, 25 per day for the whole site | The per-visitor limit stops one person using everything up; the site-wide limit caps the AI bill even if the link goes viral. Both are settings (`PUBLIC_AUDITS_PER_VISITOR_PER_DAY`, `PUBLIC_AUDITS_PER_DAY`) |
| **Access code = no limits** | You can always demo, even when the free quota is used up |
| **IP addresses are hashed** before counting | The limit works without storing personal data |
| **The address is checked before the limit** | A typo or a blocked address is refused without using up a free audit |
| **Separate counters for local, preview and production** | Testing never eats the live site's daily quota |
| **Everything still works without Redis** | Locally, or if Upstash is down, audits run; reports just aren't saved and only the access code works |

**Talking point:** "Before an interview I run the company's own website through the tool and send them the report link. It shows the product and the thinking at the same time."

## Known limits (honest answers if asked)

- Sites that build their content in the browser with JavaScript only (some single-page apps) return little text, because the reader doesn't run a browser. The fix would be a headless browser, which costs more and is slower.
- The private-address check looks at hostnames only and doesn't resolve DNS. That's fine for a demo, but a production system would check the resolved IP too.
- Some sites block automated requests. The tool then reports which pages failed instead of guessing.
- Scores are AI judgements, so running the same site twice can move a category by a point. The code checks underneath don't change.
- Each audit makes four AI calls and sends the website text with each one. Fine at demo scale; at volume, prompt caching or a shared summary would cut the cost.
- Visitors are counted by IP address, so people on a shared network (an office, a university) share the 3 free audits, and someone changing networks gets new ones. The site-wide daily cap and the AI provider's monthly spending cap are the real cost protection.
- The calls-to-action list sometimes includes navigation links styled as buttons (for example "Product"), so the CTA count is a rough signal, not an exact one.
