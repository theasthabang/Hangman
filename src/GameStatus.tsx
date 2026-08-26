import { useState } from "react"

type GameStatusProps = {
  status: "won" | "lost"
  word: string
  definition: string
  example: string
  onPlayAgain: () => void
}

// Browser-native text-to-speech — no API key, no backend call, works
// offline. Cancels any speech already in progress first so rapid
// clicks (word, then definition) don't overlap or queue up.
function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.9
  utterance.lang = "en-US"
  window.speechSynthesis.speak(utterance)
}

const speechSupported = typeof window !== "undefined" && "speechSynthesis" in window

export function GameStatus({ status, word, definition, example, onPlayAgain }: GameStatusProps) {
  const isWon = status === "won"
  const [meaningRevealed, setMeaningRevealed] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        className={[
          "glass-card w-full max-w-sm rounded-[24px] p-8 text-center shadow-2xl",
          isWon ? "border-[var(--gold)]/35" : "animate-shake border-[var(--rust)]/35",
        ].join(" ")}
        role="alertdialog"
        aria-live="assertive"
        aria-label={isWon ? "You won" : "Game over"}
      >
        <div className="font-chalk mb-1 text-3xl font-extrabold text-[var(--chalk)]">
          {isWon ? "🎉 You Won!" : "Game Over"}
        </div>
        <div className="mb-1 mt-4 text-xs uppercase tracking-wide text-[var(--chalk-dim)]">
          The word was
        </div>
        <div className="mb-4 flex items-center justify-center gap-2">
          <span className="font-mono text-2xl font-bold tracking-widest text-[var(--gold)]">
            {word}
          </span>
          {speechSupported && (
            <button
              type="button"
              onClick={() => speak(word)}
              aria-label={`Pronounce ${word}`}
              title="Hear pronunciation"
              className="rounded-full p-1.5 text-[var(--gold)] transition-colors hover:bg-[var(--gold)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]"
            >
              🔊
            </button>
          )}
        </div>
        <div className="mb-6 text-sm text-[var(--chalk-dim)]">
          {isWon ? "Excellent work!" : "Better luck next time!"}
        </div>

        {definition && example && (
          !meaningRevealed ? (
            <button
              type="button"
              onClick={() => setMeaningRevealed(true)}
              className="mb-6 w-full rounded-xl border border-[var(--chalk)]/15 bg-transparent px-4 py-2.5 text-sm font-semibold text-[var(--chalk-dim)] transition-all duration-200 hover:border-[var(--gold)]/40 hover:text-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]"
            >
              📖 Show Meaning
            </button>
          ) : (
            <div className="fade-in-up mb-6 rounded-xl border border-[var(--gold)]/20 bg-[var(--board)]/70 p-5 text-left">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wide text-[var(--gold)]">
                  Definition
                </div>
                {speechSupported && (
                  <button
                    type="button"
                    onClick={() => speak(`${word}. ${definition} For example: ${example}`)}
                    aria-label={`Listen to definition of ${word}`}
                    title="Listen to definition and example"
                    className="rounded-full p-1 text-[var(--chalk-dim)] transition-colors hover:bg-[var(--gold)]/10 hover:text-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]"
                  >
                    🔊
                  </button>
                )}
              </div>
              <p className="font-read mb-3 text-sm leading-relaxed text-[var(--chalk)]">{definition}</p>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--gold)]">
                Example
              </div>
              <p className="font-read text-sm italic leading-relaxed text-[var(--chalk-dim)]">{example}</p>
            </div>
          )
        )}

        <button
          type="button"
          onClick={() => {
            if (speechSupported) window.speechSynthesis.cancel()
            onPlayAgain()
          }}
          className="w-full rounded-xl bg-gradient-to-r from-[var(--green)] to-[var(--teal)] px-4 py-3 font-semibold text-white shadow-lg shadow-[var(--green)]/25 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] active:scale-95"
        >
          {isWon ? "Play Again" : "Try Again"}
        </button>
      </div>
    </div>
  )
}