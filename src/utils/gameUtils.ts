export const MAX_INCORRECT_GUESSES = 6
export const HINTS_PER_GAME = 2
export const MAX_RECENT_WORDS = 10

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