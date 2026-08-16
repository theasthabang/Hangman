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
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <div className="mb-3 text-sm font-semibold text-slate-300">Game Info</div>
      <dl className="space-y-2">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <dt className="text-slate-400">{row.label}</dt>
            <dd className="font-mono font-bold text-white">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}