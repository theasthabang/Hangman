type HeaderProps = {
  onNewGame: () => void
  loading: boolean
}

export function Header({ onNewGame, loading }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-4 sm:px-6">
      <div className="flex items-center gap-2 text-xl font-bold text-white sm:text-2xl">
        <span className="text-violet-400">♙</span> Hangman
      </div>
      <button
        onClick={onNewGame}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition-all hover:from-violet-500 hover:to-purple-500 hover:shadow-violet-800/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
      >
        <span aria-hidden="true">↻</span> New Game
      </button>
    </header>
  )
}