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
| **Every step is told today's date** (`dateContext()` in `prompts/shared.ts`) | AI models don't know the current date. Without it, one audit flagged an article dated yesterday as a "future date" error and made it a quick win |

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
| **The logo is a score ring** (`components/logo.tsx`, `app/icon.svg`): ink with one highlighter-yellow segment, plus the wordmark with the highlighter on "AI" | Built from the product's own signature element instead of a generic chart-and-arrow; it matches the reports and stays recognisable as a 16-pixel browser-tab icon |

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

## 14. Quick wins: one free, the rest on request (`lib/report-access.ts`)

Visitors see the first quick win in full. The others appear as blurred cards behind: *"3 more fixes for basecamp.com, ranked by impact. Message me on LinkedIn and I'll send you the full list, and help you put the fixes in place."*

| Decision | Why |
| --- | --- |
| **Show one fix in full** | A visitor has to see the quality before they have a reason to get in touch; blurring everything would remove the proof |
| **The hidden fixes are removed on the server**, and the blurred cards contain placeholder text | A CSS blur alone can be undone with the browser's inspector. Tested: a visitor's page contains only the first of the four saved fixes |
| **The full report is still saved** | When someone gets in touch, the complete list is ready to send |
| **Audits run with the access code are shown in full** (`owner` flag on the report) | The homepage showcase and the reports sent to companies before interviews show the whole quality |
| **Only the quick wins are gated** | Scores, checks, speed, brand voice, posts and the automation plan stay open, so the report is useful on its own |

**Talking point:** "The report gives real value for free and gates only the part a company would pay for: the prioritised fix list and help implementing it."

## 15. The report layout (`components/report.tsx`)

The report reads like a consultant's deliverable: the overview first, the detail further down.

| Part | Why |
| --- | --- |
| **Cover**: company logo and name, score ring, grade, date, Share button, summary, and the biggest opportunity marked in highlighter | The first screen answers "how are we doing and what should we do first?", and it matches the homepage |
| **Sticky section menu** that highlights where you are | The report is long; readers can jump straight to what they care about |
| **Scores at a glance** (six tiles), then **quick wins** | The most actionable parts come right after the overview |
| **Checks summarised** ("10 passed, nothing to fix"), problems listed first, passed checks as small chips | Readers see what needs fixing without wading through what already works |
| **Speed as rings**, like Google's own PageSpeed report | Marketers already know how to read them |
| **Automations as a flow**: Trigger → steps → Result | Shows how the workflow runs, not just a list of words |
| **"Why each score" folds open per area** | Detail and quotes stay available without crowding the page |

## 16. Growth loop: preview cards, funnel tracking, lead alerts

| Part | How | Why |
| --- | --- | --- |
| **Preview card for every report link** (`app/r/[id]/opengraph-image.tsx`) | A 1200×630 image generated on request: company, score ring, grade and the biggest opportunity, in the site's font | Every shared report becomes an ad for the tool on LinkedIn, Slack, WhatsApp and X |
| **Funnel tracking** (`lib/store/stats.ts`) | One counter per event per day in Redis: homepage visits → audits started → completed → report views → link copies → LinkedIn clicks | "I measure my own funnel." No cookies, no IP addresses, no personal data; the owner's audits are counted separately so they don't distort it |
| **Private dashboard** (`/stats`, access code) | Headline numbers, the funnel with step-to-step conversion, and a day-by-day table | Shows which offer converts (quick wins vs content plan) and where visitors drop off |
| **Lead alerts** (`lib/notify.ts`) | A click on a "Message me on LinkedIn" button posts the website and the offer to a Slack or Discord webhook; capped at 30 a day | A small real automation: I know a lead is coming, and which report they saw, before they message me |
| **Button clicks sent with `sendBeacon`** | Delivered even though the click opens LinkedIn in a new tab | Otherwise many clicks would be lost |
| **The website name in an alert comes from the saved report**, not from the browser | | A visitor can't fake which company the alert is about |

**Talking point:** "The tool runs its own growth loop: shared reports advertise it, a funnel shows what converts, and a lead alert tells me who's interested, all without cookies or personal data."

## 17. Legal basics for Germany

| Part | Why |
| --- | --- |
| **Impressum** (`/impressum`, § 5 DDG) and **privacy policy** (`/datenschutz`, Art. 13 GDPR) | Required for a German site that offers services and generates leads. Both only go live once the details in `lib/site.ts` are complete, so an incomplete notice is never published |
| **The privacy policy describes what the code really does**: Vercel hosting, Upstash storage, Gemini and PageSpeed, hashed IPs for the daily limit, no cookies | A generic template would be wrong in the details; this one has to be updated whenever a new service is added |
| **Company logos are served through our own server** (`/api/logo/<report>`) | Visitors' browsers never contact third-party sites, so their IP addresses aren't shared (the issue German courts fined websites for with Google Fonts). Only the logo saved with a report can be fetched, so the route can't be abused to make the server call arbitrary addresses |
| **robots.txt is respected** (`lib/reader/robots.ts`) | Sites that ask automated tools not to read them aren't audited; excluded pages are skipped |
| **A disclaimer on every report** | Automated AI analysis, may contain errors, not advice, not affiliated with the company. Also covers the EU AI Act's rule that AI-generated text must be recognisable as such |

## Known limits (honest answers if asked)

- Sites that build their content in the browser with JavaScript only (some single-page apps) return little text, because the reader doesn't run a browser. The fix would be a headless browser, which costs more and is slower.
- The private-address check looks at hostnames only and doesn't resolve DNS. That's fine for a demo, but a production system would check the resolved IP too.
- Some sites block automated requests. The tool then reports which pages failed instead of guessing.
- Scores are AI judgements, so running the same site twice can move a category by a point. The code checks underneath don't change.
- Each audit makes four AI calls and sends the website text with each one (about 27,000 input tokens in total). At volume, explicit caching or one shared summary of the site would cut that further.
- Visitors are counted by IP address, so people on a shared network (an office, a university) share the 3 free audits, and someone changing networks gets new ones. The site-wide daily cap and the AI provider's monthly spending cap are the real cost protection.
- PageSpeed tests the homepage only, on mobile. Google's response time varies a lot (18s to over 90s in testing), so the wait is capped at 60 seconds and the audit carries on without speed data if Google is too slow.
- The company logo comes from its site icon; some sites only provide a white logo, which shows faintly on the grey backdrop.
- The funnel counts page loads, so bots and link-preview crawlers add some homepage visits and report views. It shows trends, not exact people.
- The pages are a starting point, not legal advice; a lawyer or a generator such as e-recht24 should check them.
- Upstash stores data in the USA (region chosen for speed next to Vercel); an EU region would be the more conservative choice under GDPR.
- The calls-to-action list sometimes includes navigation links styled as buttons (for example "Product"), so the CTA count is a rough signal, not an exact one.
