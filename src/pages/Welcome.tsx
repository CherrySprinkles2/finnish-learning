import { useState } from 'react'
import { setApiKey } from '../lib/apiKey'
import { getCategories, setCategoryDisabled } from '../lib/store'

// First-run gate, in two steps:
//   1. Pick which starter word categories to deactivate (optional) — hidden ones
//      are skipped in Practice + Progress but stay editable and re-enableable in
//      the Vocabulary page later.
//   2. Paste an Anthropic API key (enabling AI answer checking) or skip and use
//      exact-match-only checking. The key can be set or changed later in Settings.
// Either way they land in the app afterwards.
export default function Welcome({ onContinue }: { onContinue: () => void }) {
  const [step, setStep] = useState<'categories' | 'apiKey'>('categories')
  // Seed categories are available here: the store seeds on first load, before
  // this gate renders. Empty (no categories) is handled by skipping step 1.
  const [categories] = useState(() => getCategories())
  const [deactivated, setDeactivated] = useState<Set<string>>(new Set())
  const [key, setKey] = useState('')

  function toggle(category: string) {
    setDeactivated((prev) => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  function goToApiKey() {
    for (const category of deactivated) setCategoryDisabled(category, true)
    setStep('apiKey')
  }

  function finish() {
    if (key.trim()) setApiKey(key)
    onContinue()
  }

  const showCategories = step === 'categories' && categories.length > 0

  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center p-4 sm:p-8">
      <div
        className={`w-full ${showCategories ? 'max-w-4xl' : 'max-w-lg'} bg-surface rounded-xl border border-line-subtle shadow-lg p-8 sm:p-10`}
      >
        <h1 className="text-h2 font-display font-bold text-ink mb-2">Finnish Learning</h1>

        {showCategories ? (
          <>
            <p className="text-ink-muted text-body mb-6">
              Your app comes with starter vocabulary grouped into the sets below. They&rsquo;re all on by
              default — untick any you&rsquo;d like to skip for now. Skipped sets are hidden from Practice and
              Progress but stay in your vocabulary, and you can re-enable them anytime from the Vocabulary page.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8 max-h-[50vh] overflow-y-auto">
              {categories.map(({ category, count }) => {
                const off = deactivated.has(category)
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggle(category)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg border border-line bg-base hover:border-line-strong cursor-pointer transition-colors text-left"
                  >
                    <span
                      className={`flex items-center justify-center h-5 w-5 rounded-md border ${
                        off
                          ? 'border-line-strong bg-base'
                          : 'border-success bg-success text-on-accent'
                      }`}
                    >
                      {!off && (
                        <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                          <path
                            d="M3 8.5l3 3 7-7"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span className={`flex-1 ${off ? 'text-ink-faint line-through' : 'text-ink'}`}>
                      {category}
                    </span>
                    <span className="text-sm text-ink-faint">{count}</span>
                  </button>
                )
              })}
            </div>

            <button
              onClick={goToApiKey}
              className="w-full py-3 px-6 bg-accent text-on-accent font-semibold rounded-lg hover:bg-accent-hover transition-colors"
            >
              Continue →
            </button>
          </>
        ) : (
          <>
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
              onKeyDown={(e) => e.key === 'Enter' && finish()}
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
                onClick={finish}
                className="flex-1 py-3 px-6 bg-accent text-on-accent font-semibold rounded-lg hover:bg-accent-hover transition-colors"
              >
                Continue →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
