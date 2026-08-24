import { useState } from "react"

type UsernameEditorProps = {
  displayName: string
  onSave: (name: string) => void
}

export function UsernameEditor({ displayName, onSave }: UsernameEditorProps) {
  // Starts open automatically if no name is set yet, since a
  // signed-in player with no display name would otherwise sync to
  // the leaderboard as "Player" with no way to notice or fix it.
  const [editing, setEditing] = useState(!displayName)
  const [draft, setDraft] = useState(displayName)

  const submit = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    onSave(trimmed)
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="mb-4 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
        <span className="text-slate-300">
          Playing as <span className="font-semibold text-violet-300">{displayName}</span>
        </span>
        <button
          type="button"
          onClick={() => {
            setDraft(displayName)
            setEditing(true)
          }}
          className="text-xs text-slate-400 underline decoration-dotted underline-offset-2 transition-colors hover:text-violet-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
        >
          Change
        </button>
      </div>
    )
  }

  return (
    <div className="mb-4 rounded-lg border border-white/10 bg-white/5 p-3">
      <label htmlFor="display-name-input" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
        Pick a leaderboard name
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
          className="flex-1 rounded-md border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!draft.trim()}
          className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
        >
          Save
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        This name is shown publicly on the leaderboard \u2014 never your email.
      </p>
    </div>
  )
}