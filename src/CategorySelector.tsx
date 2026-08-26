import type { Category } from "./types/game"

const CATEGORIES: Category[] = [
  "random", "animals", "technology", "science", "food",
  "nature", "sports", "movies", "countries", "programming",
  "space", "history",
]

type CategorySelectorProps = {
  value: Category
  onChange: (category: Category) => void
  disabled?: boolean
}

export function CategorySelector({ value, onChange, disabled }: CategorySelectorProps) {
  return (
    <div>
      <label
        className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--chalk-dim)]"
        htmlFor="category-select"
      >
        Category
      </label>
      <div className="relative">
        <select
          id="category-select"
          value={value}
          disabled={disabled}
          onChange={e => onChange(e.target.value as Category)}
          // appearance-none + an explicit inline color, since native
          // <select> text color isn't always fully honored by every
          // browser/OS combo when only set via a CSS class — this
          // guarantees the text actually renders visibly instead of
          // silently falling back to a low-contrast system default.
          style={{ color: "var(--chalk)" }}
          className="w-full appearance-none rounded-lg border border-[var(--chalk)]/15 bg-[var(--board-deep)]/70 px-4 py-2.5 pr-9 text-sm font-medium capitalize text-[var(--chalk)] transition-colors focus-visible:border-[var(--gold)]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] disabled:opacity-50"
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat} className="bg-[var(--board-deep)] capitalize text-[var(--chalk)]">
              {cat}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--chalk-dim)]"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}