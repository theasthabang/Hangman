type GameStatsProps = {
  wordLength: number
  livesLeft: number
  hintsLeft: number
}

export function GameStats({ wordLength, livesLeft, hintsLeft }: GameStatsProps) {
  const rows = [
    { label: "Word Length", value: wordLength },
    { label: "Lives Left", value: livesLeft },
    { label: "Hints Left", value: hintsLeft },
  ]
  return (
    <div className="fade-in-up glass-card rounded-[22px] p-6">
      <div className="mb-3 text-sm font-semibold text-[var(--chalk-dim)]">Game Info</div>
      <dl className="divide-y divide-[var(--chalk)]/8">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between py-2.5 text-sm first:pt-0 last:pb-0">
            <dt className="text-[var(--chalk-dim)]">{row.label}</dt>
            <dd className="font-mono font-bold text-[var(--gold)]">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}