export const MAX_INCORRECT_GUESSES = 6
export const HINTS_PER_GAME = 2
// How many recently-seen words get remembered and excluded from future
// AI requests. Was 10 — bumped up since 10 rounds in, players noticed
// words cycling back. Also shown in the "Recent Words" UI, but only
// the first 6 of these are actually displayed there (see App.tsx).
export const MAX_RECENT_WORDS = 60

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw !== null ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function saveJSON<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage unavailable (private mode, quota) — fail silently
  }
}