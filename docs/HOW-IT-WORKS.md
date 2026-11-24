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
read website + 10 code checks ──┬── brand voice ──── LinkedIn + X posts (in that voice)
                                ├── growth audit (6 scores + quick wins)
                                └── automation plan
```

| Decision | Why |
| --- | --- |
| **Website checks in code** (`lib/reader/checks.ts`): HTTPS, title and meta length, one H1, CTAs, pricing page, blog, socials… | These are facts, not opinions. Code gets them right every time, and the audit prompt tells the AI its scores must agree with them |
| **The AI scores six fixed categories; code calculates the overall score** (`lib/steps/growth-audit.ts`) | Language models are good at judgement and bad at arithmetic. The categories are fixed in code so every report has the same structure and can be compared |
| **Three steps in parallel, the social media post after brand voice** | The audit and automation plan only need the website, so they run at the same time as brand voice. The post needs the brand voice to write in it. A full run takes about a minute |
| **Strict schemas with custom rules** (for example: exactly 3 content themes, and the post's theme must be one of them) | A rule the AI breaks becomes a precise retry message ("… is not one of the theme names"), instead of a broken report |
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
| **Two limits**: 3 free audits per visitor per day, 15 per day for the whole site | The per-visitor limit stops one person using everything up; the site-wide limit caps the AI bill even if the link goes viral (15 audits at about 2.6 cents is under €0.40 a day, so the €2 monthly cap can't be used up in a single day). Both are settings (`PUBLIC_AUDITS_PER_VISITOR_PER_DAY`, `PUBLIC_AUDITS_PER_DAY`) |
| **Access code = no limits** | You can always demo, even when the free quota is used up |
| **IP addresses are hashed** before counting | The limit works without storing personal data |
| **The address is checked before the limit** | A typo or a blocked address is refused without using up a free audit |
| **Separate counters for local, preview and production** | Testing never eats the live site's daily quota |
| **Everything still works without Redis** | Locally, or if Upstash is down, audits run; reports just aren't saved and only the access code works |

**Talking point:** "Before an interview I run the company's own website through the tool and send them the report link. It shows the product and the thinking at the same time."

## 8. Speed and mobile data from Google (`lib/reader/pagespeed.ts`)

| Decision | Why |
| --- | --- |
| **Google PageSpeed Insights API** (free key, 25,000 requests a day) | Real measurements from Google instead of AI guesses. Google also uses page speed in search ranking, so it is the number marketers already trust |
| **Started at second 0**, in parallel with reading the website | Google takes 15–45 seconds (sometimes more). Starting it first means the full audit takes no longer |
| **The audit waits for it** and gets the results as facts | The SEO and conversion scores can then reflect real speed: on Basecamp the SEO verdict mentioned mobile performance because Google scored it 65 |
| **Real Chrome-user data first, the lab test second** | Google's lab test simulates a slow phone connection. For Basecamp it measured 17.6s until the main content appeared, while real visitors see it in 1.4s. Using the lab number alone would wrongly call the site slow |
| **Google's own thresholds** (main content ≤ 2.5s, layout shift ≤ 0.1, response to clicks ≤ 200ms) | These are the Core Web Vitals that Google publishes, so the checks are defensible in front of an SEO specialist |
| **Optional**: without a key the step shows as "skipped" | Without a key, Google's shared quota is almost always used up. The rest of the audit still runs |

**Talking point:** "I combine three kinds of evidence: facts measured by my own code, measurements from Google, and the AI's judgement on top. The AI has to agree with the first two."

## 9. The landing page (`app/page.tsx`)

| Decision | Why |
| --- | --- |
| **A real report next to the headline** (Basecamp, read from Redis and set never to expire) | Visitors see what they'll get before typing anything. A real result is more convincing than a description |
| **The "biggest opportunity" sentence is marked like a highlighter** | One memorable detail that looks like a reviewer marking a printed report; everything else on the page stays quiet |
| **The form starts the audit directly** (`/audit?url=…`, then the address bar is cleaned up) | One step from landing to results; reloading the page doesn't start a second audit |
| **One typeface (Schibsted Grotesk), ink navy and one yellow** | A consistent look across the homepage, audit page and shared reports. Green, amber and red appear only as score colours |
| **The audit page moved from /test to /audit**, with a permanent redirect | "test" looks unfinished on a CV, and old links keep working |
| **Project details in one file** (`lib/site.ts`) | Name, GitHub link and sample report can be changed without touching the page |

## 10. One free post, then a call to action (lead generation)

The report used to include a 14-day content pack. It now gives **two short posts** (one for LinkedIn, one for X), followed by: *"Want a full content plan for {company}? Two weeks of posts like this one, built on these three themes … Message me on LinkedIn."*

| Decision | Why |
| --- | --- |
| **Give a good sample, offer the rest** | The classic lead-magnet pattern: the free post proves the quality, the full plan is a reason to get in touch |
| **Name the company's three content themes in the offer** | Makes the offer concrete and specific to that company, not a generic "contact me" |
| **Faster and cheaper as a side effect** | Writing 14 posts took 50–90 seconds; one post takes about 13. A full audit dropped from 65–105 seconds to about 55 |
| **Old reports adapt automatically** | Reports saved with 14 posts now show only the first, with the same call to action |
| **LinkedIn link in one place** (`lib/site.ts`) | The call to action is hidden if the link is empty |

**Talking point:** "The tool is also my own funnel: every report a stranger runs ends with a reason to message me."

## 11. Recent audits on the homepage

The homepage shows the three newest audits as boxes (website, score, grade, how long ago), each linking to its full report.

| Decision | Why |
| --- | --- |
| **Only audits run with the access code are listed** | Visitors were promised that only people with the link see their report. Listing everyone's audits would break that, and anyone could put an embarrassing domain on the homepage right before an interview |
| **Listed reports never expire** | A box never leads to a missing page |
| **One box per website, newest first; the homepage sample is left out** | No duplicates, and the boxes stay varied |
| **A separate list for local, preview and production** | Local test runs never appear on the live homepage |

**Tip:** before an interview, run the company's website with your access code. It then appears on your homepage as a recent audit, and you can send them the report link.

## 12. The post, previewed as it would look in the feed (`components/social-post.tsx`)

| Decision | Why |
| --- | --- |
| **Two posts side by side: LinkedIn and X**, each in its platform's layout (LinkedIn: header, "see more", action bar; X: handle, 280-character count). Older reports can still show Instagram and Facebook layouts | A marketer judges a post by how it looks in the feed, not as plain text; two platforms show the copy adapting to each |
| **Posted by the audited company**: name, logo and colour are read from its homepage (`lib/reader/brand.ts`, no extra requests) | It feels like their post. Sites without a declared colour get one from a small palette, always the same per domain |
| **Designed visuals** for image, carousel and short-video posts: the AI writes a short headline, the page sets it on the brand colour | A branded graphic without generating images |
| **No official logos, no invented likes or follower counts** | The logos are trademarks, and fake engagement numbers would be made-up data |
| **Platform rules in the schema**: exactly one LinkedIn post then one X post, different hooks, LinkedIn at most 600 characters, X at most 280, image posts need a headline | Short posts get read in full; broken rules become precise retry messages, like every other step |
| **A sharper prompt**: scroll-stopping first line, wit in the brand's own voice, banned clichés ("game-changer", "unlock", "Did you know") | Generic AI copy is easy to spot; the bans and the hook rule push it toward something a good social media manager would write |

## 13. What an audit costs, and how it was cut by 60%

Every AI call logs its token counts (`[usage]` lines in Vercel → Logs), so cost is measured, not guessed.

**Measured on Basecamp, Gemini prices of November 2026:**

| Setup | Cost per audit | From 1 Jan 2027 (Gemini 3.8 Flash price doubles) |
| --- | --- | --- |
| All four steps on Gemini 3.8 Flash, default thinking | ~$0.061 | ~$0.12 |
| All on Gemini 3.1 Flash-Lite | ~$0.012 | ~$0.012 |
| **Mixed (current)** | **~$0.026** | **~$0.045** |

| Finding / decision | Why |
| --- | --- |
| **Hidden "thinking" was the biggest cost**: 6,451 of 10,923 output tokens, billed at the output price | Turning thinking down to "low" on the strong model removed it without hurting the audit or the post |
| **Flash-Lite for brand voice and the automation plan** | Side by side, it did these as well as Flash at a fifth of the price |
| **Gemini 3.8 Flash kept for the growth audit and the post** | With Flash-Lite, quote accuracy dropped (5 of 7 verified vs 10 of 10), quick wins became generic ("compress images") and the post used clichés. These are what a reader judges the report by |
| **Both models are settings** (`GEMINI_MODEL`, `GEMINI_MODEL_FAST`) | A price change or a new model is a config change, not a code change |

**Talking point:** "I measured cost per step before optimising. Most of the bill was the model's hidden reasoning, so I turned that down, and moved the two simplest steps to a model a fifth of the price. Cost dropped about 60% with no visible loss in the parts people read."

## Known limits (honest answers if asked)

- Sites that build their content in the browser with JavaScript only (some single-page apps) return little text, because the reader doesn't run a browser. The fix would be a headless browser, which costs more and is slower.
- The private-address check looks at hostnames only and doesn't resolve DNS. That's fine for a demo, but a production system would check the resolved IP too.
- Some sites block automated requests. The tool then reports which pages failed instead of guessing.
- Scores are AI judgements, so running the same site twice can move a category by a point. The code checks underneath don't change.
- Each audit makes four AI calls and sends the website text with each one (about 27,000 input tokens in total). At volume, explicit caching or one shared summary of the site would cut that further.
- Visitors are counted by IP address, so people on a shared network (an office, a university) share the 3 free audits, and someone changing networks gets new ones. The site-wide daily cap and the AI provider's monthly spending cap are the real cost protection.
- PageSpeed tests the homepage only, on mobile. Google's response time varies a lot (18s to over 90s in testing), so the wait is capped at 60 seconds and the audit carries on without speed data if Google is too slow.
- The company logo comes from its site icon; some sites only provide a white logo, which shows faintly on the grey backdrop.
- The calls-to-action list sometimes includes navigation links styled as buttons (for example "Product"), so the CTA count is a rough signal, not an exact one.
