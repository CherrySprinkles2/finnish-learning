import { useState } from 'react'
import { setApiKey } from '../lib/apiKey'

// First-run gate. The user can paste their Anthropic API key (enabling AI answer
// checking) or skip and use exact-match-only checking. Either way they land in
// the app afterwards; the key can be set or changed later in Settings.
export default function Welcome({ onContinue }: { onContinue: () => void }) {
  const [key, setKey] = useState('')

  function handleContinue() {
    if (key.trim()) setApiKey(key)
    onContinue()
  }

  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-lg bg-surface rounded-xl border border-line-subtle shadow-lg p-8 sm:p-10">
        <h1 className="text-h2 font-display font-bold text-ink mb-2">Finnish Learning</h1>
        <p className="text-ink-muted text-body mb-8">
          Your vocabulary and progress are stored privately in this browser. To check answers that
          aren&rsquo;t exact matches, paste your Anthropic API key below — it stays on your device and is
          used only to call the API directly. You can also skip this and add it later.
        </p>

        <label className="block text-sm font-semibold text-ink-muted mb-2" htmlFor="api-key">
          Anthropic API key (optional)
        </label>
        <input
          id="api-key"
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
          placeholder="sk-ant-…"
          autoComplete="off"
          className="w-full px-4 py-3 rounded-lg border border-line bg-base text-ink placeholder:text-ink-faint focus:outline-none focus:border-focus mb-6"
        />

        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button
            onClick={onContinue}
            className="flex-1 py-3 px-6 bg-surface text-ink-muted font-semibold rounded-lg border border-line hover:border-line-strong hover:text-ink transition-colors"
          >
            Skip for now
          </button>
          <button
            onClick={handleContinue}
            className="flex-1 py-3 px-6 bg-accent text-on-accent font-semibold rounded-lg hover:bg-accent-hover transition-colors"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  )
}
