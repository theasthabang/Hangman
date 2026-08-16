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
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <div className="mb-3 text-sm font-semibold text-slate-300">Choose a Letter</div>
      <div className="flex flex-col gap-1.5">
        {ROWS.map((row, i) => (
          <div key={i} className="flex justify-center gap-1.5">
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
                    "flex h-10 w-8 items-center justify-center rounded-lg text-sm font-bold uppercase transition-all sm:h-11 sm:w-9",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400",
                    isCorrect && "bg-violet-500 text-white shadow-md shadow-violet-500/30",
                    isIncorrect && "bg-red-500/70 text-white opacity-70",
                    !isCorrect && !isIncorrect && "bg-slate-800 text-slate-200 enabled:hover:bg-slate-700 enabled:active:scale-95",
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