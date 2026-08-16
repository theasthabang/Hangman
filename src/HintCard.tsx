type HintCardProps = {
  hint: string
  hintsLeft: number
  hintsTotal: number
  onUseHint: () => void
  disabled?: boolean
}

export function HintCard({ hint, hintsLeft, hintsTotal, onUseHint, disabled }: HintCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-300">💡 Hint</span>
        <button
          type="button"
          onClick={onUseHint}
          disabled={disabled || hintsLeft <= 0}
          className="rounded-lg border border-violet-500/50 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300 transition-colors enabled:hover:bg-violet-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:opacity-40"
        >
          Use Hint {hintsLeft}/{hintsTotal}
        </button>
      </div>
      <p className="text-sm leading-relaxed text-slate-300">{hint}</p>
    </div>
  )
}