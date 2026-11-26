// Generates the static Stryon Labs site (a fictional agency used as the demo audit target).
// Usage: node demo-site/build.js demo-site/stryon-labs
const fs = require("fs");
const path = require("path");
const out = process.argv[2];

const LOGO = `<svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#10131c"/><path d="M22 9.5H12.5a3.25 3.25 0 0 0 0 6.5h7a3.25 3.25 0 0 1 0 6.5H10" fill="none" stroke="#b9c2fb" stroke-width="3" stroke-linecap="round"/><circle cx="22" cy="9.5" r="2" fill="#3a55f0"/></svg>`;

const NAV = [
  ["/services/", "Services"],
  ["/about/", "About"],
  ["/blog/", "Blog"],
];

function page({ file, title, description, current, body }) {
  const nav = NAV.map(([href, label]) => `<a href="${href}"${current === href ? ' aria-current="page"' : ""}>${label}</a>`).join("");
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/styles.css">
</head>
<body>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/">${LOGO}Stryon Labs</a>
    <nav class="nav" aria-label="Main">${nav}</nav>
  </div>
</header>
<main>
${body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <div>
      <strong>Stryon Labs</strong><br>
      AI automation &amp; digital systems
    </div>
    <nav aria-label="Footer">${nav}</nav>
    <p class="demo-note">Stryon Labs is a fictional company. This website is a demo, made by Marc Cantacuzene to show what
      <a href="https://growth-audit-ai.vercel.app">Growth Audit AI</a> does. It does not offer real services, and the people and
      articles on it are made up.</p>
  </div>
</footer>
</body>
</html>
`;
  const target = path.join(out, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html);
}

const glyph = (d) => `<span class="glyph"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg></span>`;
const ICONS = {
  agent: '<rect x="5" y="7" width="14" height="11" rx="3"/><path d="M12 7V4M9 12h.01M15 12h.01M9.5 15.5h5"/>',
  flow: '<rect x="3" y="4" width="6" height="5" rx="1.5"/><rect x="15" y="15" width="6" height="5" rx="1.5"/><path d="M6 9v4a2 2 0 0 0 2 2h7"/>',
  data: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
};

const HERO_ART = `<svg class="hero-art" viewBox="0 0 400 400" aria-hidden="true">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a55f0"/><stop offset="1" stop-color="#b9c2fb"/></linearGradient></defs>
  <rect x="20" y="20" width="360" height="360" rx="48" fill="#10131c"/>
  ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M60 ${110 + i * 36} C 150 ${60 + i * 36}, 250 ${170 + i * 36}, 340 ${110 + i * 36}" fill="none" stroke="url(#g)" stroke-width="${3 - i * 0.3}" opacity="${1 - i * 0.12}"/>`).join("\n  ")}
  <circle cx="340" cy="110" r="9" fill="#3a55f0"/><circle cx="60" cy="290" r="6" fill="#b9c2fb"/>
</svg>`;

// Homepage. Deliberately imperfect for the demo audit: a vague headline, one call to action,
// no pricing, no customer proof, no social links and a long meta description.
page({
  file: "index.html",
  title: "Stryon Labs | AI Automation & Digital Systems Agency",
  description:
    "Stryon Labs is an AI automation and digital systems agency. We design, build and run AI agents, workflow automations, data pipelines and reporting systems for modern teams that want to grow faster.",
  current: "/",
  body: `<section class="hero">
  <div class="wrap hero-grid">
    <div>
      <h1>Intelligent systems for ambitious teams.</h1>
      <p>We design and build the AI agents, automations and data systems that quietly run the busy parts of your business.</p>
      <a class="btn" href="mailto:hello@stryonlabs.example">Book a call</a>
    </div>
    ${HERO_ART}
  </div>
</section>

<section class="dark">
  <div class="wrap">
    <span class="kicker">What we do</span>
    <h2>From manual busywork to systems that run themselves.</h2>
    <p class="lead">We work with operations, sales and marketing teams to find the work that repeats, and hand it to software.</p>
    <div class="grid grid-2">
      <div class="card">${glyph(ICONS.agent)}<h3>AI agents</h3><p>Agents that research leads, answer routine questions, sort inboxes and draft replies, with a human in the loop where it matters.</p></div>
      <div class="card">${glyph(ICONS.flow)}<h3>Workflow automation</h3><p>Connected tools instead of copy and paste: CRM, forms, email, billing and project tools working as one.</p></div>
      <div class="card">${glyph(ICONS.data)}<h3>Data pipelines</h3><p>Clean, reliable data flowing from every tool into one place, ready for reporting and AI.</p></div>
      <div class="card">${glyph(ICONS.chart)}<h3>Reporting systems</h3><p>Dashboards that update themselves, so the weekly report writes itself.</p></div>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <span class="kicker">How we work</span>
    <h2>Small steps, shipped fast.</h2>
    <ol class="steps">
      <li><span class="num">01</span><h3>Map</h3><p>We map how work moves through your team today and where it gets stuck.</p></li>
      <li><span class="num">02</span><h3>Design</h3><p>We pick the few automations with the biggest payoff and design them with you.</p></li>
      <li><span class="num">03</span><h3>Build</h3><p>We build, test and document each system, one at a time.</p></li>
      <li><span class="num">04</span><h3>Run</h3><p>We monitor, improve and extend what we built as your team grows.</p></li>
    </ol>
  </div>
</section>

<section>
  <div class="wrap">
    <span class="kicker">Our stack</span>
    <h2>We work with the tools you already use.</h2>
    <div class="stack"><span>n8n</span><span>Make</span><span>Zapier</span><span>OpenAI</span><span>Anthropic</span><span>Google Workspace</span><span>HubSpot</span><span>Airtable</span><span>Notion</span><span>Slack</span><span>Python</span><span>BigQuery</span></div>
  </div>
</section>

<section class="dark cta">
  <div class="wrap">
    <div>
      <h2>Ready to automate?</h2>
      <p class="lead">Tell us what slows your team down.</p>
    </div>
    <a class="btn" style="background:#fff;color:#10131c" href="mailto:hello@stryonlabs.example">Book a call</a>
  </div>
</section>`,
});

page({
  file: "services/index.html",
  title: "Services | Stryon Labs",
  description: "AI agents, workflow automation, data pipelines and reporting systems, designed and built by Stryon Labs.",
  current: "/services/",
  body: `<section class="page-head"><div class="wrap">
  <h1>Services</h1>
  <p class="lead">Four ways we help teams spend less time on busywork. Every project starts with a short discovery phase.</p>
</div></section>
<section style="padding-top:24px"><div class="wrap">
  <div class="grid grid-2" style="margin-top:0">
    <div class="card">${glyph(ICONS.agent)}<h3>AI agents</h3><p>Lead research and enrichment, inbox triage, first-line support answers, meeting notes and follow-ups. Built on OpenAI or Anthropic models, with clear rules and a review step.</p></div>
    <div class="card">${glyph(ICONS.flow)}<h3>Workflow automation</h3><p>Lead routing, onboarding sequences, invoice handling and internal approvals, connected across your CRM, email and project tools with n8n, Make or Zapier.</p></div>
    <div class="card">${glyph(ICONS.data)}<h3>Data pipelines</h3><p>Syncing and cleaning data between tools, de-duplicating contacts and building a single source of truth in Airtable or BigQuery.</p></div>
    <div class="card">${glyph(ICONS.chart)}<h3>Reporting systems</h3><p>Self-updating dashboards and weekly summaries for sales, marketing and operations, delivered to Slack or email.</p></div>
  </div>
  <p class="lead" style="margin-top:40px">Projects are scoped individually. <a href="mailto:hello@stryonlabs.example">Get in touch</a> for a quote.</p>
</div></section>`,
});

page({
  file: "about/index.html",
  title: "About | Stryon Labs",
  description: "Stryon Labs is a small team of engineers and operators building AI automation for growing companies.",
  current: "/about/",
  body: `<section class="page-head"><div class="wrap">
  <h1>About Stryon Labs</h1>
  <p class="lead">We're a small team of engineers and operators. We started Stryon Labs because we kept seeing smart people spend their days copying data between tools.</p>
</div></section>
<section style="padding-top:24px"><div class="wrap">
  <div class="grid grid-3" style="margin-top:0">
    <div class="card"><h3 style="margin-top:0">Practical</h3><p>We automate what saves real hours, not what looks impressive in a demo.</p></div>
    <div class="card"><h3 style="margin-top:0">Transparent</h3><p>Every system we build is documented, so your team understands and owns it.</p></div>
    <div class="card"><h3 style="margin-top:0">Careful with AI</h3><p>AI where it helps, rules where they're safer, and a human check where mistakes are costly.</p></div>
  </div>
</div></section>`,
});

const POSTS = [
  {
    slug: "ai-agents-are-not-chatbots",
    title: "AI agents are not chatbots",
    date: "2026-02-12",
    shown: "12 February 2026",
    summary: "Why the most useful agents work in the background, not in a chat window.",
    body: `<p>When people hear "AI agent", they often picture a chat window. In our projects, the most useful agents never talk to customers at all. They work in the background: reading a new lead's website, filling in the CRM, flagging the deals that need attention.</p>
<h2>Background work beats conversation</h2>
<p>A background agent has a narrow job, clear inputs and an output someone can check. That makes it easier to trust, test and improve than an open-ended chat.</p>
<h2>Start with one task</h2>
<p>Pick a task your team does every day, with a clear "done". Automate that first, measure the hours saved, then move on to the next one.</p>`,
  },
  {
    slug: "automate-the-boring-handoffs",
    title: "Automate the boring handoffs first",
    date: "2025-11-03",
    shown: "3 November 2025",
    summary: "The biggest time savings hide in the gaps between tools and teams.",
    body: `<p>Most teams look for automation inside a single tool. The bigger savings hide in the handoffs: from form to CRM, from sales to onboarding, from finished project to invoice.</p>
<h2>Find the copy and paste</h2>
<p>Ask your team where they copy data from one place to another. Each answer is a candidate for automation.</p>
<h2>Keep a human in the loop</h2>
<p>Not every handoff should be fully automatic. A quick approval step keeps quality high while still removing most of the manual work.</p>`,
  },
];

page({
  file: "blog/index.html",
  title: "Blog | Stryon Labs",
  description: "Notes on AI agents, automation and digital systems from the Stryon Labs team.",
  current: "/blog/",
  body: `<section class="page-head"><div class="wrap">
  <h1>Blog</h1>
  <p class="lead">Notes on AI agents, automation and digital systems.</p>
</div></section>
<section style="padding-top:24px"><div class="wrap posts">
${POSTS.map((p) => `  <a href="/blog/${p.slug}/"><article class="card"><time datetime="${p.date}">${p.shown}</time><h3 style="margin-top:6px">${p.title}</h3><p>${p.summary}</p></article></a>`).join("\n")}
</div></section>`,
});

for (const p of POSTS) {
  page({
    file: `blog/${p.slug}/index.html`,
    title: `${p.title} | Stryon Labs`,
    description: p.summary,
    current: "/blog/",
    body: `<div class="wrap"><article class="article" style="padding-top:72px"><time datetime="${p.date}">${p.shown}</time><h1>${p.title}</h1>${p.body}</article></div>`,
  });
}

fs.writeFileSync(path.join(out, "favicon.svg"), LOGO.replace('width="30" height="30" ', ""));
fs.writeFileSync(path.join(out, "robots.txt"), "User-agent: *\nAllow: /\n");
fs.writeFileSync(
  path.join(out, "README.md"),
  "# Stryon Labs (fictional)\n\nA made-up AI automation agency, used as the demo website for [Growth Audit AI](https://growth-audit-ai.vercel.app). It does not offer real services. The site is plain static HTML and CSS, deliberately imperfect so the audit has something to find. Pages are hidden from search engines (`noindex`).\n",
);
console.log("built");
