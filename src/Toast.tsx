import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import type { LucideIcon } from "lucide-react"

export type ToastMessage = { id: number; text: string; icon?: LucideIcon }

type ToastProps = {
  toast: ToastMessage | null
}

export function Toast({ toast }: ToastProps) {
  // Portal straight to document.body so this can never get trapped inside
  // an ancestor's stacking context (e.g. a card with backdrop-blur/transform,
  // which silently turns "fixed" into "fixed relative to that ancestor").
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const Icon = toast?.icon

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex justify-center px-4"
      aria-live="polite"
    >
      {toast && (
        <div
          key={toast.id}
          role="status"
          className="pointer-events-none flex animate-pop items-center gap-2 rounded-full border border-[var(--gold)]/25 bg-[var(--board-deep)]/95 px-5 py-2.5 text-sm font-medium text-[var(--chalk)] shadow-xl shadow-black/40 backdrop-blur-md"
        >
          {Icon && <Icon className="h-4 w-4 text-[var(--gold)]" strokeWidth={2} />}
          {toast.text}
        </div>
      )}
    </div>,
    document.body
  )
}