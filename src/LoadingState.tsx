export function LoadingState() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-24 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500/30 border-t-violet-400" />
      <div className="text-lg font-semibold text-white">🤖 AI is choosing your word...</div>
      <div className="text-sm text-slate-400">Generating a challenge...</div>
    </div>
  )
}