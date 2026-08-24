import { useEffect, useState } from "react"
import { fetchLeaderboard, type LeaderboardEntry } from "./services/statsService"

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchLeaderboard().then(result => {
      if (!cancelled) setEntries(result)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Still loading — render nothing rather than a flash of empty state.
  if (entries === null) return null

  if (entries.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm">
        <div className="mb-1 text-sm font-semibold text-slate-300">🏆 Leaderboard</div>
        <p className="text-xs text-slate-500">
          No entries yet \u2014 sign in and finish a game to be the first!
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
        🏆 Leaderboard
      </div>
      <ol className="flex flex-col gap-2">
        {entries.map((entry, i) => (
          <li
            key={`${entry.username}-${i}`}
            className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm"
          >
            <span className="flex items-center gap-2 text-slate-300">
              <span className="w-5 font-mono text-slate-500">#{i + 1}</span>
              {entry.username}
            </span>
            <span className="font-mono font-bold text-violet-300">
              {entry.bestStreak} 🔥
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}