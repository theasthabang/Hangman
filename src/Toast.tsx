import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

export type ToastMessage = { id: number; text: string }

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

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex justify-center px-4"
      aria-live="polite"
    >
      {toast && (
        <div
          key={toast.id}
          role="status"
          className="pointer-events-none animate-pop rounded-full border border-white/10 bg-slate-800/95 px-5 py-2.5 text-sm font-medium text-white shadow-xl shadow-black/40 backdrop-blur-md"
        >
          {toast.text}
        </div>
      )}
    </div>,
    document.body
  )
}