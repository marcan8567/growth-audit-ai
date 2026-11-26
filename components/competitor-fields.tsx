/**
 * "+ Compare with competitors (optional)": a fold-out with two website fields.
 * Works inside a plain GET form (homepage, fields c1 and c2) or controlled with values/onChange (audit page).
 */
export function CompetitorFields({ values, onChange }: { values?: string[]; onChange?: (values: string[]) => void }) {
  const controlled = Boolean(values && onChange);
  const open = controlled && values!.some((v) => v.trim());
  return (
    <details className="group text-sm" open={open || undefined}>
      <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-full py-1 font-medium text-ink-soft hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-marker">
        <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full border border-ink/30 text-xs transition-transform group-open:rotate-45">
          +
        </span>
        Compare with competitors <span className="font-normal">(optional)</span>
      </summary>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <label key={i} className="flex items-center rounded-lg border-2 border-ink/20 bg-white focus-within:border-ink">
            <span className="sr-only">Competitor {i + 1}</span>
            <span className="pl-3 text-ink-soft" aria-hidden="true">
              https://
            </span>
            <input
              name={`c${i + 1}`}
              inputMode="url"
              placeholder={i === 0 ? "competitor.com" : "another-competitor.com"}
              className="w-full bg-transparent px-1 py-2.5 text-ink outline-none"
              {...(controlled
                ? {
                    value: values![i].replace(/^https?:\/\//i, ""),
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange!(values!.map((v, j) => (j === i ? e.target.value : v))),
                  }
                : {})}
            />
          </label>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-soft">Each competitor is scored on the same six areas. Runs alongside the main audit and still counts as one audit.</p>
    </details>
  );
}
