const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
]

type KeyboardProps = {
  guessedLetters: string[]
  correctLetters: string[]
  incorrectLetters: string[]
  onGuess: (letter: string) => void
  disabled?: boolean
}

export function Keyboard({
  guessedLetters,
  correctLetters,
  incorrectLetters,
  onGuess,
  disabled = false,
}: KeyboardProps) {
  return (
    <div className="fade-in-up glass-card rounded-[22px] p-6">
      <div className="mb-4 text-sm font-semibold text-[var(--chalk-dim)]">Choose a Letter</div>
      <div className="flex flex-col gap-2">
        {ROWS.map((row, i) => (
          <div key={i} className="flex justify-center gap-2">
            {row.map(letter => {
              const isGuessed = guessedLetters.includes(letter)
              const isCorrect = correctLetters.includes(letter)
              const isIncorrect = incorrectLetters.includes(letter)
              const label = `Guess letter ${letter}${
                isCorrect ? ", correct" : isIncorrect ? ", incorrect" : ""
              }`
              return (
                <button
                  key={letter}
                  type="button"
                  onClick={() => onGuess(letter)}
                  disabled={isGuessed || disabled}
                  aria-label={label}
                  aria-pressed={isGuessed}
                  className={[
                    "flex h-12 w-10 items-center justify-center rounded-xl text-sm font-bold uppercase transition-all duration-150 sm:h-14 sm:w-12",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]",
                    isCorrect && "bg-[var(--gold)] text-[var(--ink)] shadow-md shadow-[var(--gold)]/30",
                    isIncorrect && "bg-[var(--rust)]/75 text-[var(--chalk)] opacity-70",
                    !isCorrect && !isIncorrect && "border border-[var(--chalk)]/12 bg-[var(--board)]/70 text-[var(--chalk)] enabled:hover:border-[var(--gold)]/50 enabled:hover:shadow-[0_0_14px_-3px_var(--gold)] enabled:active:scale-90",
                    disabled && !isGuessed && "opacity-50",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {letter}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}