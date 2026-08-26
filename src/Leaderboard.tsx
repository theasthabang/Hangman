import { useEffect, useState } from "react"
import { fetchLeaderboard, type LeaderboardEntry } from "./services/statsService"

type LeaderboardProps = {
  // Bump this (e.g. after a successful stats sync) to trigger a
  // refetch. Without this, the leaderboard only ever fetches once on
  // mount and would show stale data for the rest of the session —
  // a finished game's new entry wouldn't appear until a page reload.
  refreshKey?: number
}

export function Leaderboard({ refreshKey }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchLeaderboard().then(result => {
      if (!cancelled) setEntries(result)
    })
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  // Still loading — render nothing rather than a flash of empty state.
  if (entries === null) return null

  if (entries.length === 0) {
    return (
      <div className="fade-in-up glass-card flex flex-1 flex-col items-center justify-center rounded-[22px] p-6 text-center">
        <div className="font-chalk mb-1 text-2xl font-bold text-[var(--chalk)]">🏆 Leaderboard</div>
        <p className="text-xs text-[var(--chalk-dim)]">
          No entries yet \u2014 sign in and finish a game to be the first!
        </p>
      </div>
    )
  }

  return (
    <div className="fade-in-up glass-card flex flex-1 flex-col rounded-[22px] p-7">
      <div className="font-chalk mb-5 flex items-center gap-2 text-[22px] font-extrabold text-[var(--chalk)]">
        🏆 Leaderboard
      </div>
      <ol className="flex flex-col divide-y divide-[var(--chalk)]/8">
        {entries.map((entry, i) => (
          <li
            key={`${entry.username}-${i}`}
            className="flex items-center justify-between px-1 py-3 text-sm transition-colors duration-150 hover:bg-[var(--chalk)]/5"
          >
            <span className="flex items-center gap-3">
              <span
                className={[
                  "w-6 font-mono",
                  i === 0 ? "text-[var(--award)]" : "text-[var(--chalk-mute)]",
                ].join(" ")}
              >
                #{i + 1}
              </span>
              <span className={i === 0 ? "font-semibold text-[var(--chalk)]" : "text-[var(--chalk-dim)]"}>
                {entry.username}
              </span>
            </span>
            <span className="flex items-center gap-1 font-mono font-bold text-[var(--gold)]">
              {entry.bestStreak} 🔥
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}