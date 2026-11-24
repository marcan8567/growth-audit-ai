import Link from "next/link";

// Placeholder landing page. The real landing page (headline, sample report, form) comes in Milestone 4.
export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-24">
      <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">Growth Audit AI</p>
      <h1 className="text-4xl font-semibold leading-tight">
        Any company URL in, a growth audit out — in under 2 minutes.
      </h1>
      <p className="text-lg text-stone-600">
        Brand voice, a scored growth audit, a ready-to-post content pack and an automation plan, built from the
        company&apos;s own public website.
      </p>
      <Link
        href="/test"
        className="w-fit rounded-lg bg-stone-900 px-5 py-3 font-medium text-white hover:bg-stone-700"
      >
        Run a growth audit
      </Link>
    </main>
  );
}
