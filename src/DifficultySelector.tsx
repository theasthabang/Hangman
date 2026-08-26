import type { Difficulty } from "./types/game"

const OPTIONS: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
]

type DifficultySelectorProps = {
  value: Difficulty
  onChange: (difficulty: Difficulty) => void
  disabled?: boolean
}

export function DifficultySelector({ value, onChange, disabled }: DifficultySelectorProps) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--chalk-dim)]">
        Difficulty
      </div>
      <div className="flex gap-2" role="radiogroup" aria-label="Difficulty">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={value === opt.value}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={[
              "flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
              value === opt.value
                ? "border-[var(--gold)] bg-[var(--gold)]/20 text-[var(--gold)]"
                : "border-[var(--chalk)]/12 bg-[var(--board-deep)]/50 text-[var(--chalk-dim)] hover:border-[var(--chalk)]/25 hover:bg-[var(--board-deep)]/70",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]",
              "disabled:opacity-50",
            ].join(" ")}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}