type WordDisplayProps = {
  word: string
  guessedLetters: string[]
  reveal?: boolean
}

export function WordDisplay({ word, guessedLetters, reveal = false }: WordDisplayProps) {
  return (
    <div className="fade-in-up glass-card rounded-[22px] p-6">
      <div className="mb-4 text-sm font-semibold text-[var(--chalk-dim)]">The Word</div>
      <div className="flex flex-wrap gap-3 font-mono text-3xl font-bold tracking-widest text-[var(--chalk)] sm:text-4xl">
        {word.split("").map((letter, i) => {
          const isGuessed = guessedLetters.includes(letter)
          return (
            <span
              key={i}
              className="flex h-12 w-9 items-end justify-center border-b-2 border-[var(--gold)]/50 pb-1 shadow-[0_1px_10px_-2px_var(--gold)] sm:h-14 sm:w-11"
            >
              <span
                className={[
                  isGuessed || reveal ? "visible" : "invisible",
                  !isGuessed && reveal ? "text-[var(--rust)]" : "text-[var(--chalk)]",
                  isGuessed ? "inline-block animate-pop" : "",
                ].join(" ")}
              >
                {letter}
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}