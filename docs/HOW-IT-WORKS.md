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

## 4. Streaming progress (`app/api/brand-voice-test/route.ts`)

The server sends one JSON line per event (`running`, `done`, `error`) as each step happens. The page reads the stream and lights up each step as it finishes.

**Why:** a full audit takes 1 to 2 minutes. Showing live progress makes the wait feel short. It also keeps the connection active instead of idle.

## 5. Swappable AI provider (`lib/ai/complete.ts`)

`complete()` is the only function that talks to an AI provider. `AI_PROVIDER=anthropic` (default) calls Claude through the Anthropic SDK; `AI_PROVIDER=gemini` calls Gemini through Google's `@google/genai` SDK. Both return plain text plus a "was it cut off" flag, so JSON parsing, Zod validation, the retry and the grounding check are identical for both.

**Talking point:** "The pipeline doesn't trust any model's output, so swapping the model is a one-line config change. The same checks catch a bad answer from either provider."

## Known limits (honest answers if asked)

- Sites that build their content in the browser with JavaScript only (some single-page apps) return little text, because the reader doesn't run a browser. The fix would be a headless browser, which costs more and is slower.
- The private-address check looks at hostnames only and doesn't resolve DNS. That's fine for a demo, but a production system would check the resolved IP too.
- Some sites block automated requests. The tool then reports which pages failed instead of guessing.
