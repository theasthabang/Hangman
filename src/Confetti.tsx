import { useState } from "react"

const COLORS = ["#a78bfa", "#c4b5fd", "#f5f3ff", "#8b5cf6"]
const PIECES = 26

type Piece = {
  left: number
  delay: number
  duration: number
  color: string
  size: number
}

function createPieces(): Piece[] {
  return Array.from({ length: PIECES }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.3,
    duration: 1.6 + Math.random() * 1,
    color: COLORS[i % COLORS.length],
    size: 4 + Math.random() * 5,
  }))
}

export function Confetti() {
  // Lazy initializer runs Math.random() exactly once, on mount — not on
  // every re-render — so unrelated state changes (toasts, etc.) while
  // this is showing don't reshuffle positions and restart animations.
  const [pieces] = useState(createPieces)

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden="true">
      {pieces.map((piece, i) => (
        <span
          key={i}
          className="absolute top-[-10px] rounded-full"
          style={{
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            opacity: 0.85,
            animation: `confetti-fall ${piece.duration}s ${piece.delay}s ease-in forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.9; }
          100% { transform: translateY(105vh) rotate(280deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}