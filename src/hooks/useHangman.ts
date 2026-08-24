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
}

export function useHangman() {
  // Clerk's hooks are safe to call here even though this is a custom
  // hook, not a component — React only cares that hooks are called
  // from within a component's render (which useHangman() itself is,
  // since App.tsx calls it during render, inside <ClerkProvider>).
  const { isSignedIn, getToken } = useAuth()
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

  const [stats, setStats] = useState<GameStats>(() => loadJSON("hangman:stats", DEFAULT_STATS))
  const [recentWords, setRecentWords] = useState<string[]>(() =>
    loadJSON<string[]>("hangman:recentWords", [])
  )

  // A player-chosen leaderboard name, separate from their Clerk account
  // entirely — never their email. Persisted locally, not tied to any
  // one Clerk field, so it works the same regardless of whether the
  // player signed up with email, Google, etc.
  const [displayName, setDisplayNameState] = useState<string>(() =>
    loadJSON("hangman:displayName", "")
  )

  const setDisplayName = useCallback((name: string) => {
    const trimmed = name.trim().slice(0, 30)
    setDisplayNameState(trimmed)
    saveJSON("hangman:displayName", trimmed)
  }, [])

  useEffect(() => {
    saveJSON("hangman:stats", stats)

    // Cloud sync only for signed-in users — guests keep working
    // exactly as before, purely on localStorage. A failed sync here
    // never throws or blocks the game; see statsService.ts.
    //
    // Username priority: the player's own chosen display name first
    // (never their email), then Clerk's username field if they set
    // one, then a generic fallback. Email is deliberately never used
    // here — it shouldn't ever end up on a public leaderboard.
    if (isSignedIn && user) {
      const username = displayName || user.username || "Player"
      syncStatsToCloud(getToken, username, stats)
    }
  }, [stats, isSignedIn, user, getToken, displayName])

  useEffect(() => {
    saveJSON("hangman:recentWords", recentWords)
  }, [recentWords])

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
    recentWords,
    displayName,
    setDisplayName,
    isSignedIn: !!isSignedIn,
    startNewGame,
    guessLetter,
    useHint,
    setDifficulty,
    setCategory,
  }
}