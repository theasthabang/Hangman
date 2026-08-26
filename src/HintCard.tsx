type HintCardProps = {
  hint: string
  hintsLeft: number
  hintsTotal: number
  onUseHint: () => void
  disabled?: boolean
}

export function HintCard({ hint, hintsLeft, hintsTotal, onUseHint, disabled }: HintCardProps) {
  return (
    <div className="fade-in-up glass-card rounded-[22px] p-6">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-[var(--chalk-dim)]">💡 Hint</span>
        <button
          type="button"
          onClick={onUseHint}
          disabled={disabled || hintsLeft <= 0}
          className="rounded-lg border border-[var(--gold)]/45 bg-transparent px-3 py-1.5 text-xs font-semibold text-[var(--gold)] transition-all duration-200 enabled:hover:-translate-y-0.5 enabled:hover:bg-[var(--gold)]/10 enabled:hover:shadow-[0_0_16px_-4px_var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] disabled:opacity-40"
        >
          Use Hint ({hintsLeft}/{hintsTotal})
        </button>
      </div>
      <p className="font-read text-sm leading-relaxed text-[var(--chalk-dim)]">{hint}</p>
    </div>
  )
}