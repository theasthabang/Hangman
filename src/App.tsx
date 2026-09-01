import { useEffect, useRef, useState } from "react"
import { Play, Gamepad2, Trophy, Percent, Flame, Crown, CheckCircle2, XCircle, PartyPopper, Target, Lightbulb, type LucideIcon } from "lucide-react"
import { Header} from "./Header"
import { DifficultySelector } from "./DifficultySelector"
import { CategorySelector } from "./CategorySelector"
import { LoadingState } from "./LoadingState"
import { HangmanDrawing } from "./HangmanDrawing"
import { GameStats } from "./GameStats"
import { WordDisplay } from "./WordDisplay"
import { HintCard } from "./HintCard"
import { Keyboard } from "./Keyboard"
import { GameStatus } from "./GameStatus"
import { Confetti } from "./Confetti"
import { Toast, type ToastMessage } from "./Toast"
import { Leaderboard } from "./Leaderboard"
import { Achievements } from "./Achievements"
import { UsernameEditor } from "./UsernameEditor"
import { useHangman } from "./hooks/useHangman"
import { HINTS_PER_GAME, MAX_INCORRECT_GUESSES } from "./utils/gameUtils"

const TOAST_DURATION_MS = 1800

function App() {
  const game = useHangman()
  const [toast, setToast] = useState<ToastMessage | null>(null)
  // Session-only, not localStorage — a guest who dismisses this
  // shouldn't be nagged again this visit, but it's fine to gently
  // remind them again next time they come back.
  const [guestNudgeDismissed, setGuestNudgeDismissed] = useState(() => {
    try {
      return window.sessionStorage.getItem("hangman:guestNudgeDismissed") === "1"
    } catch {
      return false
    }
  })
  const toastIdRef = useRef(0)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevGuessCountRef = useRef(0)

  const showToast = (text: string, icon?: LucideIcon) => {
    const id = toastIdRef.current++
    setToast({ id, text, icon })
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), TOAST_DURATION_MS)
  }

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [])

  // physical keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase()
      if (!/^[A-Z]$/.test(key)) return
      if (game.status !== "playing" || !game.currentWord) return
      if (game.guessedLetters.includes(key)) return
      e.preventDefault()
      game.guessLetter(key)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [game])

  // toast feedback on each new guess
  useEffect(() => {
    const count = game.guessedLetters.length
    if (count === 0 || count <= prevGuessCountRef.current) {
      prevGuessCountRef.current = count
      return
    }
    const lastLetter = game.guessedLetters[count - 1]
    prevGuessCountRef.current = count

    // Hint-added letters already get their own "Hint used" toast from
    // HintCard's onUseHint — showing "Great guess!" right after would
    // just overwrite it, since hint letters are always correct.
    if (game.hintLetters.includes(lastLetter)) return

    if (game.currentWord?.word.includes(lastLetter)) {
      showToast("Great guess!", CheckCircle2)
    } else {
      showToast("Wrong letter!", XCircle)
    }
  }, [game.guessedLetters, game.currentWord, game.hintLetters])

  useEffect(() => {
    if (game.status === "won") {
      if (game.incorrectGuesses === 0) {
        showToast("Perfect Game!", Target)
      } else {
        showToast("Amazing!", PartyPopper)
      }
    }
  }, [game.status])

  const winRate =
    game.stats.gamesPlayed > 0
      ? Math.round((game.stats.gamesWon / game.stats.gamesPlayed) * 100)
      : 0

  return (
    <div className="fade-in-up min-h-screen bg-[var(--board)] text-[var(--chalk)]">
      <Header onNewGame={() => game.startNewGame()} loading={game.loading} />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-8 sm:pt-10">
        {!game.currentWord && !game.loading && (
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[3fr_2fr]">
            <div className="fade-in-up glass-card flex flex-col gap-6 rounded-[22px] p-8">
              <DifficultySelector value={game.difficulty} onChange={game.setDifficulty} />
              <CategorySelector value={game.category} onChange={game.setCategory} />

              {game.error && (
                <div
                  role="alert"
                  className="rounded-lg border border-[var(--rust)]/35 bg-[var(--rust)]/10 p-3 text-sm text-[#f0b3a8]"
                >
                  {game.error}
                </div>
              )}

              <button
                type="button"
                onClick={() => game.startNewGame()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--green)] to-[var(--teal)] px-4 py-3 font-semibold text-white shadow-lg shadow-[var(--green)]/20 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[var(--green)]/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] active:scale-95"
              >
                {game.error ? (
                  "Try Again"
                ) : (
                  <>
                    <Play className="h-4 w-4" fill="currentColor" /> Start Game
                  </>
                )}
              </button>

              {game.stats.gamesPlayed > 0 && (
                <div className="grid grid-cols-3 divide-x divide-[var(--chalk)]/10 border-t border-[var(--chalk)]/12 pt-4 text-center text-xs sm:grid-cols-5">
                  <StatBlock icon={Gamepad2} label="Played" value={game.stats.gamesPlayed} />
                  <StatBlock icon={Trophy} label="Won" value={game.stats.gamesWon} />
                  <StatBlock icon={Percent} label="Win Rate" value={`${winRate}%`} />
                  <StatBlock icon={Flame} label="Streak" value={game.stats.currentStreak} />
                  <StatBlock icon={Crown} label="Best Streak" value={game.stats.bestStreak} />
                </div>
              )}

              {game.recentWords.length > 0 && (
                <div className="border-t border-[var(--chalk)]/12 pt-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--chalk-dim)]">
                    Recent Words
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {game.recentWords.slice(0, 6).map((w, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-[var(--board-deep)]/70 px-3 py-1 font-mono text-xs text-[var(--chalk-dim)]"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {game.statsLoaded && <Achievements stats={game.stats} />}
            </div>

            <div className="flex h-full flex-col gap-4">
              {game.isSignedIn && game.displayNameLoaded && (
                <UsernameEditor displayName={game.displayName} onSave={game.setDisplayName} />
              )}
              {!game.isSignedIn && !guestNudgeDismissed && (
                <div className="glass-card fade-in-up flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--gold)]/15">
                    <Trophy className="h-4 w-4 text-[var(--gold)]" strokeWidth={2} />
                  </div>
                  <span className="flex-1 text-[var(--chalk-dim)]">
                    Sign in to save your streak and join the leaderboard
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setGuestNudgeDismissed(true)
                      try {
                        window.sessionStorage.setItem("hangman:guestNudgeDismissed", "1")
                      } catch {
                        // sessionStorage unavailable — dismissal just won't persist, not worth failing over
                      }
                    }}
                    aria-label="Dismiss"
                    className="shrink-0 text-[var(--chalk-mute)] transition-colors hover:text-[var(--chalk)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]"
                  >
                    <XCircle className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              )}
              <Leaderboard refreshKey={game.leaderboardRefreshKey} />
            </div>
          </div>
        )}

        {game.loading && <LoadingState />}

        {game.currentWord && !game.loading && (
          <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:items-stretch">
            <div className="flex h-full flex-col gap-6">
              <HangmanDrawing
                incorrectGuesses={game.incorrectGuesses}
                maxGuesses={MAX_INCORRECT_GUESSES}
              />
              <GameStats
                wordLength={game.currentWord.word.length}
                livesLeft={MAX_INCORRECT_GUESSES - game.incorrectGuesses}
                hintsLeft={game.hintsRemaining}
              />
            </div>

            <div className="flex flex-col gap-6">
              <WordDisplay
                word={game.currentWord.word}
                guessedLetters={game.guessedLetters}
                reveal={game.status === "lost"}
              />
              <HintCard
                hint={game.currentWord.hint}
                hintsLeft={game.hintsRemaining}
                hintsTotal={HINTS_PER_GAME}
                onUseHint={() => {
                  game.useHint()
                  showToast("Hint used", Lightbulb)
                }}
                disabled={game.status !== "playing"}
              />
              <Keyboard
                guessedLetters={game.guessedLetters}
                correctLetters={game.guessedLetters.filter(l => game.currentWord!.word.includes(l))}
                incorrectLetters={game.incorrectLetters}
                onGuess={game.guessLetter}
                disabled={game.status !== "playing"}
              />
            </div>
          </div>
        )}
      </main>

      {game.status === "won" && <Confetti />}

      {(game.status === "won" || game.status === "lost") && game.currentWord && (
        <GameStatus
          status={game.status}
          word={game.currentWord.word}
          definition={game.currentWord.definition}
          example={game.currentWord.example}
          onPlayAgain={() => game.startNewGame()}
        />
      )}

      <Toast toast={toast} />
    </div>
  )
}

type StatBlockProps = {
  icon: LucideIcon
  label: string
  value: string | number
}

function StatBlock({ icon: Icon, label, value }: StatBlockProps) {
  return (
    <div className="flex flex-col items-center gap-1 px-1">
      <Icon className="h-4 w-4 text-[var(--gold)]" strokeWidth={2} />
      <div className="font-mono text-lg font-bold text-[var(--chalk)]">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-[var(--chalk-dim)]">{label}</div>
    </div>
  )
}

export default App