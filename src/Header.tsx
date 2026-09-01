import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react"
import { Puzzle } from "lucide-react"

type HeaderProps = {
  onNewGame: () => void
  loading: boolean
}

export function Header({ onNewGame, loading }: HeaderProps) {
  return (
    <header className="border-b border-[var(--chalk)]/8">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-8 sm:py-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--green)] to-[var(--teal)] text-xl shadow-lg shadow-[var(--green)]/25">
            <Puzzle className="h-6 w-6 text-[var(--ink)]" strokeWidth={2.2} />
          </div>
          <div>
            <div className="font-chalk text-2xl font-extrabold leading-tight text-[var(--chalk)] sm:text-[26px]">
              Hangman
            </div>
            <div className="text-xs text-[var(--chalk-dim)]">
              Guess the word, save the man!
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-xl border border-[var(--green)]/30 bg-transparent px-4 py-2.5 text-sm font-medium text-[var(--chalk-dim)] transition-all duration-200 hover:border-[var(--green)]/60 hover:text-[var(--chalk)] hover:shadow-[0_0_16px_-4px_var(--green)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <button
            onClick={onNewGame}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--green)] to-[var(--teal)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[var(--green)]/25 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[var(--green)]/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:hover:translate-y-0"
          >
            <span aria-hidden="true">↻</span> New Game
          </button>
        </div>
      </div>
    </header>
  )
}