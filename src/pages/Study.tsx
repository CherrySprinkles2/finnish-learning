import { useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import type { Word } from '../types'
import { getWords } from '../lib/store'

const UNCATEGORISED = 'Uncategorised'

function categoryKey(w: Word) {
  return w.category?.trim() || UNCATEGORISED
}

export default function Study() {
  const [words] = useState<Word[]>(() => getWords())
  const [params] = useSearchParams()
  const selected = params.get('category') // null = no selection; '' = Uncategorised

  // No category chosen → the category list already lives on the Vocabulary page.
  if (selected === null) {
    return <Navigate to="/words" replace />
  }

  const label = selected === '' ? UNCATEGORISED : selected
  const deck = words.filter(w => (selected === '' ? !w.category : categoryKey(w) === selected))
  return <ModeHub label={label} category={selected} count={deck.length} />
}

interface Mode {
  label: string
  desc: string
  icon: string
  to?: string
  soon?: boolean
}

function ModeHub({ label, category, count }: { label: string; category: string; count: number }) {
  const cat = encodeURIComponent(category)
  const modes: Mode[] = [
    { label: 'Flashcards', desc: 'Flip cards to review — recognition', icon: '🃏', to: `/flashcards?category=${cat}` },
    { label: 'Matching', desc: 'Tap to pair Finnish with English', icon: '🔗', to: `/matching?category=${cat}` },
    { label: 'Typed recall', desc: 'Type the translation from memory', icon: '⌨️', to: `/practice?category=${cat}` },
    { label: 'Multiple choice', desc: 'Pick the right translation from four', icon: '✅', to: `/quiz?category=${cat}` },
  ]

  return (
    <div className="min-h-screen bg-base p-8">
      <div className="max-w-3xl mx-auto">
        <Link to="/words" className="text-sm text-accent hover:underline">← Vocabulary</Link>
        <div className="flex items-baseline gap-3 mt-3 mb-1 flex-wrap">
          <h1 className="text-h3 font-display font-bold text-ink">{label}</h1>
          <span className="text-sm text-ink-faint">{count} words</span>
        </div>
        <p className="text-ink-faint mb-8">Choose how you want to study this group.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modes.map(mode => {
            const inner = (
              <>
                <span className="text-h2 leading-none mb-3">{mode.icon}</span>
                <span className="flex items-center gap-2 font-display font-semibold text-ink">
                  {mode.label}
                  {mode.soon && (
                    <span className="px-2 py-0.5 rounded-full bg-overlay text-ink-faint text-xs font-medium uppercase tracking-wider">
                      Soon
                    </span>
                  )}
                </span>
                <span className="block text-sm text-ink-muted mt-1">{mode.desc}</span>
              </>
            )
            if (mode.soon || !mode.to) {
              return (
                <div
                  key={mode.label}
                  className="flex flex-col bg-surface rounded-lg border border-line-subtle p-6 opacity-50 cursor-not-allowed"
                  aria-disabled
                >
                  {inner}
                </div>
              )
            }
            return (
              <Link
                key={mode.label}
                to={mode.to}
                className="flex flex-col bg-surface rounded-lg border border-line shadow-sm p-6 hover:shadow-md hover:border-accent transition-all"
              >
                {inner}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
