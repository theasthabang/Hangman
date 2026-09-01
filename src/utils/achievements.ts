import type { LucideIcon } from "lucide-react"
import { Medal, Flame, Zap, Target, Gem, BookOpen, Award, Brain } from "lucide-react"
import type { GameStats } from "../types/game"

export type Achievement = {
  id: string
  icon: LucideIcon
  label: string
  description: string
  unlocked: boolean
}

// All achievements are pure functions of stats already being tracked
// (plus perfectGames, which is local-only — see types/game.ts). No
// new backend/database fields required; these are entirely derived
// and computed fresh every render, so they can never drift out of
// sync with the stats that unlocked them.
export function getAchievements(stats: GameStats): Achievement[] {
  const winRate =
    stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0

  return [
    {
      id: "first-win",
      icon: Medal,
      label: "First Win",
      description: "Win your first game",
      unlocked: stats.gamesWon >= 1,
    },
    {
      id: "streak-5",
      icon: Flame,
      label: "On Fire",
      description: "Reach a 5-game win streak",
      unlocked: stats.bestStreak >= 5,
    },
    {
      id: "streak-10",
      icon: Zap,
      label: "Unstoppable",
      description: "Reach a 10-game win streak",
      unlocked: stats.bestStreak >= 10,
    },
    {
      id: "perfect-game",
      icon: Target,
      label: "Perfect Game",
      description: "Win without a single wrong guess",
      unlocked: stats.perfectGames >= 1,
    },
    {
      id: "perfect-5",
      icon: Gem,
      label: "Flawless Five",
      description: "Win 5 perfect games",
      unlocked: stats.perfectGames >= 5,
    },
    {
      id: "veteran",
      icon: BookOpen,
      label: "Word Veteran",
      description: "Play 25 games",
      unlocked: stats.gamesPlayed >= 25,
    },
    {
      id: "century",
      icon: Award,
      label: "Century Club",
      description: "Play 100 games",
      unlocked: stats.gamesPlayed >= 100,
    },
    {
      id: "sharpshooter",
      icon: Brain,
      label: "Sharpshooter",
      description: "Reach a 70% win rate (min. 10 games played)",
      unlocked: stats.gamesPlayed >= 10 && winRate >= 70,
    },
  ]
}