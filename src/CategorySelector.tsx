import { useEffect, useRef, useState } from "react"
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

// A fully custom dropdown, built entirely from <div>/<button> — not a
// native <select>. Native <select> text rendering can be silently
// overridden by OS-level settings (Windows forced-colors/high-contrast
// modes, some browser themes) in a way CSS genuinely cannot fix, no
// matter how explicit the color declaration is. Plain HTML text in a
// styled div has no such escape hatch — it always renders exactly
// what CSS says, which is the actual, permanent fix here.
export function CategorySelector({ value, onChange, disabled }: CategorySelectorProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <div
        id="category-label"
        className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--chalk-dim)]"
      >
        Category
      </div>

      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby="category-label"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-[var(--chalk)]/15 bg-[var(--board-deep)]/70 px-4 py-2.5 text-left text-sm font-medium transition-colors focus-visible:border-[var(--gold)]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] disabled:opacity-50"
      >
        <span className="capitalize text-[var(--chalk)]">{value}</span>
        <svg
          className={[
            "h-4 w-4 shrink-0 text-[var(--chalk-dim)] transition-transform duration-150",
            open ? "rotate-180" : "",
          ].join(" ")}
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-labelledby="category-label"
          className="glass-card absolute z-20 mt-2 flex max-h-64 w-full flex-col overflow-y-auto rounded-lg p-1 shadow-xl"
        >
          {CATEGORIES.map(cat => {
            const isSelected = cat === value
            return (
              <button
                key={cat}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(cat)
                  setOpen(false)
                }}
                className={[
                  "flex w-full items-center rounded-md px-3 py-2 text-left text-sm capitalize transition-colors",
                  isSelected
                    ? "bg-[var(--gold)]/15 font-semibold text-[var(--gold)]"
                    : "text-[var(--chalk)] hover:bg-[var(--chalk)]/8",
                ].join(" ")}
              >
                {cat}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}