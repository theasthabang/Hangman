import { useEffect, useRef, useState } from "react"
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
import { UsernameEditor } from "./UsernameEditor"
import { useHangman } from "./hooks/useHangman"
import { HINTS_PER_GAME, MAX_INCORRECT_GUESSES } from "./utils/gameUtils"

const TOAST_DURATION_MS = 1800

function App() {
  const game = useHangman()
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const toastIdRef = useRef(0)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevGuessCountRef = useRef(0)

  const showToast = (text: string) => {
    const id = toastIdRef.current++
    setToast({ id, text })
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
      showToast("✓ Great guess!")
    } else {
      showToast("✕ Wrong letter!")
    }
  }, [game.guessedLetters, game.currentWord, game.hintLetters])

  useEffect(() => {
    if (game.status === "won") showToast("🎉 Amazing!")
  }, [game.status])

  const winRate =
    game.stats.gamesPlayed > 0
      ? Math.round((game.stats.gamesWon / game.stats.gamesPlayed) * 100)
      : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <Header onNewGame={() => game.startNewGame()} loading={game.loading} />

      <main className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        {!game.currentWord && !game.loading && (
          <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1fr_320px]">
            <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
              <DifficultySelector value={game.difficulty} onChange={game.setDifficulty} />
              <CategorySelector value={game.category} onChange={game.setCategory} />

              {game.error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
                >
                  {game.error}
                </div>
              )}

              <button
                type="button"
                onClick={() => game.startNewGame()}
                className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition-all hover:from-violet-500 hover:to-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 active:scale-95"
              >
                {game.error ? "Try Again" : "Start Game"}
              </button>

              {game.stats.gamesPlayed > 0 && (
                <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-4 text-center text-xs sm:grid-cols-5">
                  <StatBlock label="Played" value={game.stats.gamesPlayed} />
                  <StatBlock label="Won" value={game.stats.gamesWon} />
                  <StatBlock label="Win Rate" value={`${winRate}%`} />
                  <StatBlock label="Streak" value={game.stats.currentStreak} />
                  <StatBlock label="Best Streak" value={game.stats.bestStreak} />
                </div>
              )}

              {game.recentWords.length > 0 && (
                <div className="border-t border-white/10 pt-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Recent Words
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {game.recentWords.slice(0, 6).map((w, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-white/5 px-3 py-1 font-mono text-xs text-slate-400"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex h-full flex-col gap-4">
              {game.isSignedIn && (
                <UsernameEditor displayName={game.displayName} onSave={game.setDisplayName} />
              )}
              <Leaderboard />
            </div>
          </div>
        )}

        {game.loading && <LoadingState />}

        {game.currentWord && !game.loading && (
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <div className="flex flex-col gap-6">
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
                  showToast("💡 Hint used")
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

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="font-mono text-lg font-bold text-white">{value}</div>
      <div className="text-slate-500">{label}</div>
    </div>
  )
} 