import type { Category } from "../types/game"

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
        className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400"
        htmlFor="category-select"
      >
        Category
      </label>
      <select
        id="category-select"
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value as Category)}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm capitalize text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:opacity-50"
      >
        {CATEGORIES.map(cat => (
          <option key={cat} value={cat} className="bg-slate-900 capitalize">
            {cat}
          </option>
        ))}
      </select>
    </div>
  )
}