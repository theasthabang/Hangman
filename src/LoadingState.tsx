import { Bot } from "lucide-react"

export function LoadingState() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-24 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--gold)]/30 border-t-[var(--gold)]" />
      <div className="font-chalk flex items-center gap-2 text-2xl font-bold text-[var(--chalk)]">
        <Bot className="h-6 w-6 text-[var(--gold)]" strokeWidth={2} /> AI is choosing your word...
      </div>
      <div className="text-sm text-[var(--chalk-dim)]">Generating a challenge...</div>
    </div>
  )
}