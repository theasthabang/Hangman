import { useState } from "react"

type UsernameEditorProps = {
  displayName: string
  onSave: (name: string) => void
}

// Once a display name is saved, there is deliberately NO way to
// change it from this component — no "Change" button, no re-entry
// into edit mode. One Clerk account = one permanent leaderboard name.
// If displayName is already set, this always renders the read-only
// view; the input form only ever appears for a brand-new account
// that hasn't chosen a name yet.
export function UsernameEditor({ displayName, onSave }: UsernameEditorProps) {
  const [draft, setDraft] = useState("")

  const submit = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    onSave(trimmed)
  }

  if (displayName) {
    return (
      <div className="mb-4 flex items-center justify-between rounded-lg border border-[var(--chalk)]/12 bg-[var(--board-deep)]/60 px-3 py-2 text-sm">
        <span className="text-[var(--chalk-dim)]">
          Playing as <span className="font-semibold text-[var(--gold)]">{displayName}</span>
        </span>
      </div>
    )
  }

  return (
    <div className="mb-4 rounded-lg border border-[var(--chalk)]/12 bg-[var(--board-deep)]/60 p-3">
      <label
        htmlFor="display-name-input"
        className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--chalk-dim)]"
      >
        Pick a leaderboard name — choose carefully, this can't be changed later
      </label>
      <div className="flex items-center gap-2">
        <input
          id="display-name-input"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") submit()
          }}
          placeholder="e.g. WordWizard99"
          maxLength={30}
          autoFocus
          className="flex-1 rounded-md border font-mono text-teal-950 border-[var(--chalk)]/15 bg-[var(--board)]/70 px-3 py-2 text-sm text-[var(--chalk)] placeholder:text-[var(--chalk-dim)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!draft.trim()}
          className="rounded-md bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition-colors hover:brightness-110 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]"
        >
          Save
        </button>
      </div>
      <p className="mt-2 text-xs text-[var(--chalk-dim)]">
        This name is shown publicly on the leaderboard — never your email. It's permanent once saved.
      </p>
    </div>
  )
}