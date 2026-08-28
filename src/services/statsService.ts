import type { GameStats } from "../types/game"

// Same pattern as wordService.ts — empty in dev (Vite's proxy handles
// it), the real backend URL in production.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? ""

export type LeaderboardEntry = {
  username: string
  bestStreak: number
  gamesWon: number
}

/**
 * Syncs the signed-in user's stats to the backend. Silently does
 * nothing if getToken() returns null (not signed in) — this is what
 * keeps guest play working untouched; this function is simply never
 * meaningfully called for guests.
 *
 * Deliberately fails silently (console.warn, not a thrown error) on
 * network/server failure — a failed cloud sync should never interrupt
 * or break the actual game the player is in the middle of. localStorage
 * already has the authoritative local copy of their stats regardless.
 */
export async function syncStatsToCloud(
  getToken: () => Promise<string | null>,
  username: string,
  stats: GameStats
): Promise<boolean> {
  let token: string | null
  try {
    token = await getToken()
  } catch {
    return false
  }
  if (!token) return false

  try {
    const response = await fetch(`${API_BASE_URL}/api/stats/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        username,
        gamesPlayed: stats.gamesPlayed,
        gamesWon: stats.gamesWon,
        currentStreak: stats.currentStreak,
        bestStreak: stats.bestStreak,
      }),
    })
    if (!response.ok) {
      console.warn("Stats sync failed:", response.status)
      return false
    }
    return true
  } catch (err) {
    console.warn("Stats sync failed:", err)
    return false
  }
}

/**
 * Fetches the public leaderboard. No auth needed — this is public
 * read data, same as any other GET request.
 */
export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/leaderboard`)
    if (!response.ok) return []
    return (await response.json()) as LeaderboardEntry[]
  } catch {
    return []
  }
}