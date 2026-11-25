import { TESTIMONIALS } from "@/lib/site";

/**
 * Quotes from people who used the audit. Shows nothing until TESTIMONIALS in lib/site.ts has entries:
 * only real quotes, with the person's permission to show their name.
 */
export function Testimonials() {
  if (!TESTIMONIALS.length) return null;
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="text-3xl font-bold tracking-tight">What people say</h2>
      <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <li key={t.name} className="flex flex-col rounded-2xl border border-ink/10 bg-white p-6">
            <svg viewBox="0 0 32 24" className="h-6 w-8 text-marker" fill="currentColor" aria-hidden="true">
              <path d="M0 24V13.7C0 5.9 4.4 1.3 12.2 0l1.4 3.3C9.4 4.6 7.4 7.1 7.2 11H13v13zm18 0V13.7C18 5.9 22.4 1.3 30.2 0l1.4 3.3c-4.2 1.3-6.2 3.8-6.4 7.7H31v13z" />
            </svg>
            <blockquote className="mt-4 flex-1 text-lg leading-relaxed">{t.quote}</blockquote>
            <p className="mt-5 text-sm">
              <span className="font-semibold">{t.name}</span>
              <span className="block text-ink-soft">{t.company ? `${t.role}, ${t.company}` : t.role}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
