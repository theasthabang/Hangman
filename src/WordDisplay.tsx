type WordDisplayProps = {
  word: string
  guessedLetters: string[]
  reveal?: boolean
}

export function WordDisplay({ word, guessedLetters, reveal = false }: WordDisplayProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <div className="mb-3 text-sm font-semibold text-slate-300">The Word</div>
      <div className="flex flex-wrap gap-2 font-mono text-3xl font-bold tracking-widest text-white sm:text-4xl">
        {word.split("").map((letter, i) => {
          const isGuessed = guessedLetters.includes(letter)
          return (
            <span
              key={i}
              className="flex h-12 w-9 items-end justify-center border-b-4 border-violet-500/40 sm:h-14 sm:w-11"
            >
              <span
                className={[
                  isGuessed || reveal ? "visible" : "invisible",
                  !isGuessed && reveal ? "text-red-400" : "text-white",
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