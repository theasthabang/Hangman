type HangmanDrawingProps = {
  incorrectGuesses: number
  maxGuesses: number
}

const PARTS = [
  { el: <circle cx="140" cy="70" r="20" />, length: 126 },
  { el: <line x1="140" y1="90" x2="140" y2="150" />, length: 60 },
  { el: <line x1="140" y1="110" x2="100" y2="90" />, length: 45 }, // left arm
  { el: <line x1="140" y1="110" x2="180" y2="90" />, length: 45 }, // right arm
  { el: <line x1="140" y1="150" x2="110" y2="190" />, length: 50 }, // left leg
  { el: <line x1="140" y1="150" x2="170" y2="190" />, length: 50 }, // right leg
]

export function HangmanDrawing({ incorrectGuesses, maxGuesses }: HangmanDrawingProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-300">Incorrect Guesses</span>
        <span
          className="font-mono font-bold text-violet-300"
          aria-live="polite"
        >
          {incorrectGuesses}/{maxGuesses}
        </span>
      </div>
      <svg
        viewBox="0 0 260 220"
        className="mx-auto h-[200px] w-[230px]"
        strokeLinecap="round"
        fill="none"
        role="img"
        aria-label={`Hangman figure, ${incorrectGuesses} of ${maxGuesses} incorrect guesses drawn`}
      >
        <g stroke="#64748b" strokeWidth={4} opacity={0.7}>
          <line x1="10" y1="210" x2="130" y2="210" />
          <line x1="40" y1="210" x2="40" y2="10" />
          <line x1="40" y1="10" x2="140" y2="10" />
          <line x1="140" y1="10" x2="140" y2="40" />
        </g>
        {PARTS.slice(0, incorrectGuesses).map((part, i) => (
          <g
            key={i}
            className="animate-draw"
            stroke="#a78bfa"
            strokeWidth={5}
            style={{ strokeDasharray: part.length, strokeDashoffset: part.length }}
          >
            {part.el}
          </g>
        ))}
      </svg>
    </div>
  )
}