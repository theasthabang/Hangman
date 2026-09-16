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

// Loads a piece of account-scoped data, migrating it in from the
// shared guest bucket the FIRST time this specific account is ever
// seen on this browser.
//
// Why this is safe: it only ever reads/writes the account's OWN key
// plus the guest key — never another account's key — so it can never
// clobber a different signed-in user's real saved progress. It only
// migrates when the account key has genuinely never been written
// before (existing === null), so a returning user's real stats are
// never replaced by stale guest data. And it deletes the guest key
// immediately after migrating, so if a second, different person plays
// as a guest on the same shared browser afterward, they start fresh
// instead of inheriting (or re-triggering a migration of) progress
// that already got claimed by the first account.
function loadWithGuestMigration<T>(
  accountKey: string,
  guestKey: string,
  fallback: T,
  hasProgress: (value: T) => boolean
): T {
  // The guest bucket itself never migrates from anything — this guard
  // just keeps the function correct if it's ever called for the guest
  // key directly.
  if (accountKey === guestKey) return loadJSON(accountKey, fallback)

  const existing = loadJSON<T | null>(accountKey, null)
  if (existing !== null) return existing

  const guestValue = loadJSON<T | null>(guestKey, null)
  if (guestValue !== null && hasProgress(guestValue)) {
    saveJSON(accountKey, guestValue)
    window.localStorage.removeItem(guestKey)
    return guestValue
  }

  return fallback
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
  // loaded (statsState.key, part of the same state object as the data
  // itself — see below for why it's bundled together). This is
  // deliberately NOT a plain boolean flag set via setState — a boolean
  // like that would lag one render behind an auth change (state
  // updates from an effect only apply starting the NEXT render),
  // creating a window where a "save" effect could see a stale
  // "loaded=true" alongside stale data from the PREVIOUS user, and
  // write it into the NEW user's storage key — silently overwriting
  // their real saved progress. Deriving it fresh every render closes
  // that window completely, since it flips to false in the very same
  // render the auth context changes, before any other effect can act
  // on stale data.
  const authKeySuffix = authLoaded ? user?.id ?? null : undefined
  const statsKey = authKeySuffix === undefined ? null : scopedKey("hangman:stats", authKeySuffix)
  const recentWordsKey =
    authKeySuffix === undefined ? null : scopedKey("hangman:recentWords", authKeySuffix)

  // Bundled into one state object (value + the key it belongs to) so
  // the load effect below only ever needs ONE setState call instead of
  // two separate ones (previously setStats + setLoadedStatsKey). Same
  // data, same guarantees — just one atomic update instead of two.
  const [statsState, setStatsState] = useState<{ key: string | null; value: GameStats }>({
    key: null,
    value: DEFAULT_STATS,
  })
  const [recentWordsState, setRecentWordsState] = useState<{ key: string | null; value: string[] }>({
    key: null,
    value: [],
  })

  const stats = statsState.value
  const recentWords = recentWordsState.value
  const statsLoaded = statsKey !== null && statsState.key === statsKey
  const recentWordsLoaded = recentWordsKey !== null && recentWordsState.key === recentWordsKey

  // NOT a useEffect. loadJSON() reads localStorage synchronously — no
  // async wait, no subscription to an external event. That means this
  // isn't "synchronizing with an external system" (the case effects
  // exist for) — it's a plain derived-value reset when statsKey
  // changes, which React explicitly documents as safe to do with a
  // conditional setState call directly in the render body ("Adjusting
  // some state when a prop changes" on react.dev). React detects the
  // state change and re-renders immediately before committing
  // anything to the screen — no extra effect-triggered render pass,
  // and (correctly) no set-state-in-effect warning, since this rule
  // only scans inside useEffect callbacks.
  if (statsKey && statsKey !== statsState.key) {
    const guestStatsKey = scopedKey("hangman:stats", null)
    const value = loadWithGuestMigration(
      statsKey,
      guestStatsKey,
      DEFAULT_STATS,
      s => s.gamesPlayed > 0
    )
    setStatsState({ key: statsKey, value })
  }

  if (recentWordsKey && recentWordsKey !== recentWordsState.key) {
    const guestRecentWordsKey = scopedKey("hangman:recentWords", null)
    const value = loadWithGuestMigration(
      recentWordsKey,
      guestRecentWordsKey,
      [] as string[],
      arr => arr.length > 0
    )
    setRecentWordsState({ key: recentWordsKey, value })
  }

  // A player-chosen leaderboard name, separate from their Clerk account
  // entirely — never their email. Scoped to THIS SPECIFIC user's Clerk
  // ID (hangman:displayName:<userId>), not one shared key — otherwise
  // two different people signing into the same browser would inherit
  // or overwrite each other's name. This is also what makes it a true
  // "ask once, remembered forever for that account" flow, matching
  // how real apps handle it, instead of re-prompting or leaking
  // across accounts.
  //
  // name + loaded are bundled into one state object for the same
  // reason as stats/recentWords above — one setState call per effect
  // run instead of two.
  // "__unset__" is a sentinel meaning "haven't checked yet for any
  // auth state" — distinct from both `null` (checked, and confirmed
  // signed-out) and any real Clerk user id, so the very first render
  // always triggers the initial load below.
  const NOT_YET_CHECKED = "__unset__"

  const [displayNameState, setDisplayNameStateFull] = useState<{
    name: string
    loaded: boolean
    checkedFor: string | null
  }>({
    name: "",
    loaded: false,
    checkedFor: NOT_YET_CHECKED,
  })
  const [leaderboardRefreshKey, setLeaderboardRefreshKey] = useState(0)

  const displayName = displayNameState.name
  const displayNameLoaded = displayNameState.loaded

  // Same reasoning as the stats/recentWords blocks above: loadJSON()
  // is a synchronous localStorage read, so this is a derived-value
  // reset on auth change, not a "synchronize with an external system"
  // effect — a conditional setState in the render body is the correct
  // (and lint-clean) tool here, not useEffect.
  if (authKeySuffix !== undefined && authKeySuffix !== displayNameState.checkedFor) {
    if (authKeySuffix === null) {
      // Reset to NOT-loaded (loaded: false), not true. If this were
      // true here, a later sign-in by the same user would satisfy
      // App.tsx's "isSignedIn && displayNameLoaded" gate on the very
      // first render — before the real name has actually been fetched
      // — so UsernameEditor would mount with an empty name,
      // permanently lock its "show the input" state (a useState
      // initializer only runs once per mount), and never correct
      // itself even after the real saved name loads a moment later.
      // Keeping this false forces App.tsx to wait for the fetch below
      // to finish before UsernameEditor is allowed to mount at all.
      setDisplayNameStateFull({ name: "", loaded: false, checkedFor: null })
    } else {
      setDisplayNameStateFull({
        name: loadJSON(`hangman:displayName:${authKeySuffix}`, ""),
        loaded: true,
        checkedFor: authKeySuffix,
      })
    }
  }

  // One account = one permanent leaderboard name. Guarded here too
  // (not just in UsernameEditor.tsx) so this stays true no matter what
  // calls setDisplayName — the UI is the first line of defense, this
  // is the second. Once displayNameState.name is non-empty, this is a
  // permanent no-op.
  const setDisplayName = useCallback(
    (name: string) => {
      if (!user) return
      if (displayNameState.name) return
      const trimmed = name.trim().slice(0, 30)
      setDisplayNameStateFull(prev => ({ ...prev, name: trimmed }))
      saveJSON(`hangman:displayName:${user.id}`, trimmed)
    },
    [user?.id, displayNameState.name]
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
        setRecentWordsState(prev => ({
          ...prev,
          value: [result.word, ...prev.value].slice(0, MAX_RECENT_WORDS),
        }))
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

  // Win/lose detection lives HERE, run directly off the letters that
  // were just guessed — not in a useEffect reacting to guessedLetters
  // changing a render later. This is the pattern React itself
  // recommends ("you might not need an Effect"): a game finishing is a
  // direct, synchronous consequence of the guess that just happened,
  // not something to derive reactively after the fact. Shared by both
  // guessLetter and useHint, since a hint-completed word should end
  // the game exactly the same way a manual guess does.
  const applyGuessedLetters = useCallback(
    (nextGuessedLetters: string[]) => {
      if (!currentWord) return
      setGuessedLetters(nextGuessedLetters)

      const isWon = currentWord.word.split("").every(letter => nextGuessedLetters.includes(letter))
      const nextIncorrectGuesses = nextGuessedLetters.filter(
        letter => !currentWord.word.includes(letter)
      ).length
      const isLost = !isWon && nextIncorrectGuesses >= MAX_INCORRECT_GUESSES

      if (isWon) {
        setStatus("won")
        setStatsState(prev => {
          const nextStreak = prev.value.currentStreak + 1
          return {
            ...prev,
            value: {
              gamesPlayed: prev.value.gamesPlayed + 1,
              gamesWon: prev.value.gamesWon + 1,
              currentStreak: nextStreak,
              bestStreak: Math.max(prev.value.bestStreak, nextStreak),
              perfectGames: prev.value.perfectGames + (nextIncorrectGuesses === 0 ? 1 : 0),
            },
          }
        })
      } else if (isLost) {
        setStatus("lost")
        setStatsState(prev => ({
          ...prev,
          value: { ...prev.value, gamesPlayed: prev.value.gamesPlayed + 1, currentStreak: 0 },
        }))
      }
    },
    [currentWord]
  )

  const guessLetter = useCallback(
    (letter: string) => {
      if (!currentWord || status !== "playing") return
      const upper = letter.toUpperCase()
      if (guessedLetters.includes(upper)) return
      applyGuessedLetters([...guessedLetters, upper])
    },
    [currentWord, status, guessedLetters, applyGuessedLetters]
  )

  const useHint = useCallback(() => {
    if (!currentWord || status !== "playing" || hintsUsed >= HINTS_PER_GAME) return
    const remaining = currentWord.word.split("").filter(l => !guessedLetters.includes(l))
    if (remaining.length === 0) return
    const letter = remaining[Math.floor(Math.random() * remaining.length)]
    setHintLetters(prev => [...prev, letter])
    setHintsUsed(n => n + 1)
    applyGuessedLetters([...guessedLetters, letter])
  }, [currentWord, status, hintsUsed, guessedLetters, applyGuessedLetters])

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