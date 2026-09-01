import { useCallback, useEffect, useState } from "react"
import { useAuth, useUser } from "@clerk/clerk-react"
import type { Category, Difficulty, GameStats, GameStatus, GeneratedWord } from "../types/game"
import { generateWord, WordServiceError } from "../services/wordService"
import { syncStatsToCloud } from "../services/statsService"
import {
  HINTS_PER_GAME,
  MAX_INCORRECT_GUESSES,
  MAX_RECENT_WORDS,
  loadJSON,
  saveJSON,
} from "../utils/gameUtils"

const DEFAULT_STATS: GameStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  bestStreak: 0,
  perfectGames: 0,
}

// Builds the localStorage key a piece of data should live under for
// the CURRENT auth context — a specific signed-in account, or a
// shared "guest" bucket for anyone not signed in. Used for both stats
// and recent words so progress never leaks between different Clerk
// accounts sharing one browser, and guests get their own separate
// history too.
function scopedKey(base: string, userId: string | null | undefined): string {
  return userId ? `${base}:${userId}` : `${base}:guest`
}

export function useHangman() {
  // Clerk's hooks are safe to call here even though this is a custom
  // hook, not a component — React only cares that hooks are called
  // from within a component's render (which useHangman() itself is,
  // since App.tsx calls it during render, inside <ClerkProvider>).
  const { isSignedIn, getToken, isLoaded: authLoaded } = useAuth()
  const { user } = useUser()

  const [difficulty, setDifficulty] = useState<Difficulty>("medium")
  const [category, setCategory] = useState<Category>("random")

  const [currentWord, setCurrentWord] = useState<GeneratedWord | null>(null)
  const [guessedLetters, setGuessedLetters] = useState<string[]>([])
  const [status, setStatus] = useState<GameStatus>("playing")
  const [hintsUsed, setHintsUsed] = useState(0)
  const [hintLetters, setHintLetters] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // --- Stats & recent words: scoped per-account, race-condition-safe ---
  //
  // "Loaded" is DERIVED fresh every render by comparing the key we
  // SHOULD be showing right now (statsKey, computed straight from the
  // current auth state) against the key whose data we last actually
  // loaded (loadedStatsKey, a real state value). This is deliberately
  // NOT a plain boolean flag set via setState — a boolean like that
  // would lag one render behind an auth change (state updates from an
  // effect only apply starting the NEXT render), creating a window
  // where a "save" effect could see a stale "loaded=true" alongside
  // stale data from the PREVIOUS user, and write it into the NEW
  // user's storage key — silently overwriting their real saved
  // progress. Deriving it fresh every render closes that window
  // completely, since it flips to false in the very same render the
  // auth context changes, before any other effect can act on stale
  // data.
  const authKeySuffix = authLoaded ? user?.id ?? null : undefined
  const statsKey = authKeySuffix === undefined ? null : scopedKey("hangman:stats", authKeySuffix)
  const recentWordsKey =
    authKeySuffix === undefined ? null : scopedKey("hangman:recentWords", authKeySuffix)

  const [stats, setStats] = useState<GameStats>(DEFAULT_STATS)
  const [recentWords, setRecentWords] = useState<string[]>([])
  const [loadedStatsKey, setLoadedStatsKey] = useState<string | null>(null)
  const [loadedRecentWordsKey, setLoadedRecentWordsKey] = useState<string | null>(null)

  const statsLoaded = statsKey !== null && loadedStatsKey === statsKey
  const recentWordsLoaded = recentWordsKey !== null && loadedRecentWordsKey === recentWordsKey

  useEffect(() => {
    if (!statsKey || statsKey === loadedStatsKey) return
    setStats(loadJSON(statsKey, DEFAULT_STATS))
    setLoadedStatsKey(statsKey)
  }, [statsKey, loadedStatsKey])

  useEffect(() => {
    if (!recentWordsKey || recentWordsKey === loadedRecentWordsKey) return
    setRecentWords(loadJSON<string[]>(recentWordsKey, []))
    setLoadedRecentWordsKey(recentWordsKey)
  }, [recentWordsKey, loadedRecentWordsKey])

  // A player-chosen leaderboard name, separate from their Clerk account
  // entirely — never their email. Scoped to THIS SPECIFIC user's Clerk
  // ID (hangman:displayName:<userId>), not one shared key — otherwise
  // two different people signing into the same browser would inherit
  // or overwrite each other's name. This is also what makes it a true
  // "ask once, remembered forever for that account" flow, matching
  // how real apps handle it, instead of re-prompting or leaking
  // across accounts.
  const [displayName, setDisplayNameState] = useState<string>("")
  const [displayNameLoaded, setDisplayNameLoaded] = useState(false)
  const [leaderboardRefreshKey, setLeaderboardRefreshKey] = useState(0)

  useEffect(() => {
    if (!authLoaded) return
    if (!user) {
      // Reset to NOT-loaded (false), not true. If this were true here,
      // a later sign-in by the same user would satisfy App.tsx's
      // "isSignedIn && displayNameLoaded" gate on the very first render
      // — before this effect has actually re-run to fetch their saved
      // name — so UsernameEditor would mount with an empty name,
      // permanently lock its "show the input" state (a useState
      // initializer only runs once per mount), and never correct
      // itself even after the real saved name loads a moment later.
      // Keeping this false forces App.tsx to wait for the fetch below
      // to finish before UsernameEditor is allowed to mount at all.
      setDisplayNameState("")
      setDisplayNameLoaded(false)
      return
    }
    setDisplayNameState(loadJSON(`hangman:displayName:${user.id}`, ""))
    setDisplayNameLoaded(true)
    // Depends on user.id specifically, not the whole user object —
    // Clerk can return a new object reference across renders even for
    // the same logged-in user, which would otherwise needlessly re-run
    // this (harmless, but no reason to).
  }, [authLoaded, user?.id])

  const setDisplayName = useCallback(
    (name: string) => {
      if (!user) return
      const trimmed = name.trim().slice(0, 30)
      setDisplayNameState(trimmed)
      saveJSON(`hangman:displayName:${user.id}`, trimmed)
    },
    [user?.id]
  )

  useEffect(() => {
    // Guards on statsLoaded (see the derived-key explanation above) so
    // this can never fire with the wrong context's data — either
    // before this account's real stats have loaded, or with a stale
    // snapshot left over from a different account/guest state.
    if (!statsKey || !statsLoaded) return
    saveJSON(statsKey, stats)

    // Cloud sync only for signed-in users — guests keep working
    // exactly as before, purely on localStorage. A failed sync here
    // never throws or blocks the game; see statsService.ts.
    //
    // Waits on displayNameLoaded so a game finishing in the split
    // second before localStorage has been read doesn't accidentally
    // sync "Player" and overwrite a name the user already chose.
    //
    // Username priority: the player's own chosen display name first
    // (never their email), then Clerk's username field if they set
    // one, then a generic fallback. Email is deliberately never used
    // here — it shouldn't ever end up on a public leaderboard.
    if (isSignedIn && user && displayNameLoaded) {
      const username = displayName || user.username || "Player"
      syncStatsToCloud(getToken, username, stats).then(success => {
        if (success) setLeaderboardRefreshKey(k => k + 1)
      })
    }
  }, [stats, statsKey, statsLoaded, isSignedIn, user, getToken, displayName, displayNameLoaded])

  useEffect(() => {
    if (!recentWordsKey || !recentWordsLoaded) return
    saveJSON(recentWordsKey, recentWords)
  }, [recentWords, recentWordsKey, recentWordsLoaded])

  const incorrectLetters = currentWord
    ? guessedLetters.filter(letter => !currentWord.word.includes(letter))
    : []
  const incorrectGuesses = incorrectLetters.length

  const startNewGame = useCallback(
    async (nextDifficulty?: Difficulty, nextCategory?: Category) => {
      const targetDifficulty = nextDifficulty ?? difficulty
      const targetCategory = nextCategory ?? category
      setDifficulty(targetDifficulty)
      setCategory(targetCategory)
      setLoading(true)
      setError(null)
      setGuessedLetters([])
      setHintsUsed(0)
      setHintLetters([])
      setStatus("playing")

      try {
        const result = await generateWord(targetDifficulty, targetCategory, recentWords)
        setCurrentWord(result)
        setRecentWords(prev => [result.word, ...prev].slice(0, MAX_RECENT_WORDS))
      } catch (err) {
        setError(
          err instanceof WordServiceError
            ? err.message
            : "Unable to generate a word. Please try again."
        )
        setCurrentWord(null)
      } finally {
        setLoading(false)
      }
    },
    [difficulty, category, recentWords]
  )

  const guessLetter = useCallback(
    (letter: string) => {
      if (!currentWord || status !== "playing") return
      const upper = letter.toUpperCase()
      if (guessedLetters.includes(upper)) return
      setGuessedLetters(prev => [...prev, upper])
    },
    [currentWord, status, guessedLetters]
  )

  const useHint = useCallback(() => {
    if (!currentWord || status !== "playing" || hintsUsed >= HINTS_PER_GAME) return
    const remaining = currentWord.word.split("").filter(l => !guessedLetters.includes(l))
    if (remaining.length === 0) return
    const letter = remaining[Math.floor(Math.random() * remaining.length)]
    setGuessedLetters(prev => [...prev, letter])
    setHintLetters(prev => [...prev, letter])
    setHintsUsed(n => n + 1)
  }, [currentWord, status, hintsUsed, guessedLetters])

  // win/lose detection — runs locally, no AI call involved
  useEffect(() => {
    if (!currentWord || status !== "playing") return

    const isWon = currentWord.word.split("").every(letter => guessedLetters.includes(letter))
    const isLost = incorrectGuesses >= MAX_INCORRECT_GUESSES

    if (isWon) {
      setStatus("won")
      setStats(prev => {
        const nextStreak = prev.currentStreak + 1
        return {
          gamesPlayed: prev.gamesPlayed + 1,
          gamesWon: prev.gamesWon + 1,
          currentStreak: nextStreak,
          bestStreak: Math.max(prev.bestStreak, nextStreak),
          perfectGames: prev.perfectGames + (incorrectGuesses === 0 ? 1 : 0),
        }
      })
    } else if (isLost) {
      setStatus("lost")
      setStats(prev => ({ ...prev, gamesPlayed: prev.gamesPlayed + 1, currentStreak: 0 }))
    }
  }, [guessedLetters, currentWord, status, incorrectGuesses])

  return {
    difficulty,
    category,
    currentWord,
    guessedLetters,
    incorrectLetters,
    incorrectGuesses,
    status,
    hintsUsed,
    hintLetters,
    hintsRemaining: HINTS_PER_GAME - hintsUsed,
    loading,
    error,
    stats,
    statsLoaded,
    recentWords,
    displayName,
    setDisplayName,
    displayNameLoaded,
    leaderboardRefreshKey,
    isSignedIn: !!isSignedIn,
    startNewGame,
    guessLetter,
    useHint,
    setDifficulty,
    setCategory,
  }
}