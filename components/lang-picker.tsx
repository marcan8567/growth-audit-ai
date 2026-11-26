import { LANG_NAMES, LANGS, type Lang } from "@/lib/i18n";

/**
 * "Report language: English · Español · Deutsch" as pill-shaped radio buttons.
 * Works inside a plain GET form (homepage) or controlled with value/onChange (audit page).
 */
export function LangPicker({ value, onChange, dark = false }: { value?: Lang; onChange?: (lang: Lang) => void; dark?: boolean }) {
  return (
    <fieldset className="flex flex-wrap items-center gap-2 text-sm">
      <legend className={`mr-1 float-left py-1 ${dark ? "text-white/70" : "text-ink-soft"}`}>Report language</legend>
      {LANGS.map((lang) => (
        <label key={lang} className="cursor-pointer">
          <input
            type="radio"
            name="lang"
            value={lang}
            className="peer sr-only"
            {...(onChange ? { checked: value === lang, onChange: () => onChange(lang) } : { defaultChecked: lang === "en" })}
          />
          <span className="block rounded-full border border-ink/20 px-3 py-1 font-medium text-ink-soft peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-marker hover:border-ink">
            {LANG_NAMES[lang]}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
