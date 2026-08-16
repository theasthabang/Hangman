type GameStatusProps = {
  status: "won" | "lost"
  word: string
  onPlayAgain: () => void
}

export function GameStatus({ status, word, onPlayAgain }: GameStatusProps) {
  const isWon = status === "won"
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div
        className={[
          "w-full max-w-sm rounded-2xl border p-8 text-center shadow-2xl",
          isWon ? "border-violet-500/40 bg-slate-900" : "animate-shake border-red-500/40 bg-slate-900",
        ].join(" ")}
        role="alertdialog"
        aria-live="assertive"
        aria-label={isWon ? "You won" : "Game over"}
      >
        <div className="mb-2 text-3xl font-bold text-white">
          {isWon ? "🎉 YOU WON!" : "GAME OVER"}
        </div>
        <div className="mb-1 mt-4 text-xs uppercase tracking-wide text-slate-400">
          The word was
        </div>
        <div className="mb-4 font-mono text-2xl font-bold tracking-widest text-violet-300">
          {word}
        </div>
        <div className="mb-6 text-sm text-slate-400">
          {isWon ? "Excellent work!" : "Better luck next time!"}
        </div>
        <button
          type="button"
          onClick={onPlayAgain}
          className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3 font-semibold text-white shadow-lg shadow-violet-900/30 transition-all hover:from-violet-500 hover:to-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 active:scale-95"
        >
          {isWon ? "Play Again" : "Try Again"}
        </button>
      </div>
    </div>
  )
}