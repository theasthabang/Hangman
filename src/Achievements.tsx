import { getAchievements } from "./utils/achievements"
import type { GameStats } from "./types/game"

type AchievementsProps = {
  stats: GameStats
}

export function Achievements({ stats }: AchievementsProps) {
  const achievements = getAchievements(stats)
  const unlockedCount = achievements.filter(a => a.unlocked).length

  // Nothing to show yet for a brand-new player — an all-locked grid
  // on first visit reads as "you have nothing" rather than motivating,
  // so it only appears once at least one badge exists to display,
  // OR once they've played enough that unlocking the first one feels
  // imminent. Keeping it simple: show once they've played at least
  // one game, so "First Win" appears as a visible next goal.
  if (stats.gamesPlayed === 0) return null

  return (
    <div className="border-t border-[var(--chalk)]/12 pt-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--chalk-dim)]">
          Achievements
        </div>
        <div className="text-xs text-[var(--chalk-dim)]">
          {unlockedCount}/{achievements.length}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {achievements.map(({ id, icon: Icon, label, description, unlocked }) => (
          <div
            key={id}
            title={`${label} — ${description}${unlocked ? " (Unlocked!)" : " (Locked)"}`}
            className={[
              "flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-200",
              unlocked
                ? "border-[var(--gold)]/40 bg-[var(--gold)]/12 shadow-[0_0_12px_-4px_var(--gold)]"
                : "border-[var(--chalk)]/10 bg-[var(--board)]/40 opacity-30",
            ].join(" ")}
          >
            <Icon
              className={unlocked ? "h-5 w-5 text-[var(--gold)]" : "h-5 w-5 text-[var(--chalk-dim)]"}
              strokeWidth={2}
            />
          </div>
        ))}
      </div>
    </div>
  )
}