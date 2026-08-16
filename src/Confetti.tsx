const COLORS = ["#a78bfa", "#c4b5fd", "#f5f3ff", "#8b5cf6"]
const PIECES = 26

export function Confetti() {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden="true">
      {Array.from({ length: PIECES }).map((_, i) => {
        const left = Math.random() * 100
        const delay = Math.random() * 0.3
        const duration = 1.6 + Math.random() * 1
        const color = COLORS[i % COLORS.length]
        const size = 4 + Math.random() * 5
        return (
          <span
            key={i}
            className="absolute top-[-10px] rounded-full"
            style={{
              left: `${left}%`,
              width: size,
              height: size,
              backgroundColor: color,
              opacity: 0.85,
              animation: `confetti-fall ${duration}s ${delay}s ease-in forwards`,
            }}
          />
        )
      })}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.9; }
          100% { transform: translateY(105vh) rotate(280deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}