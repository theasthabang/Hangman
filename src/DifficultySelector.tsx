import type { Difficulty } from "../types/game"

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
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
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
                ? "border-violet-500 bg-violet-500/20 text-violet-300"
                : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400",
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