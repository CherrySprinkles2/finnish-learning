import { useState } from 'react'
import { grammarChapters } from '../data/grammar'
import ChapterSection from '../components/grammar/ChapterSection'
import GrammarTOC from '../components/grammar/GrammarTOC'

export default function Grammar() {
  // Kappale 1 open by default, the rest collapsed.
  const [open, setOpen] = useState<Set<number>>(new Set([1]))

  function toggle(number: number) {
    setOpen(prev => {
      const next = new Set(prev)
      if (next.has(number)) next.delete(number)
      else next.add(number)
      return next
    })
  }

  function jump(number: number) {
    setOpen(prev => new Set(prev).add(number))
    // Wait for the section to expand before scrolling to it.
    requestAnimationFrame(() => {
      document.getElementById(`kappale-${number}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
    <div className="min-h-screen bg-base">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <header className="mb-8">
          <h1 className="text-h3 font-display font-bold text-ink">Grammar</h1>
          <p className="text-ink-faint mt-1">
            Quick reference, explanations, and self-tests — aligned with Suomen mestari 1.
          </p>
        </header>

        {/* Mobile chapter jump */}
        <div className="lg:hidden mb-6">
          <select
            onChange={e => jump(Number(e.target.value))}
            defaultValue=""
            className="w-full px-4 py-2 rounded-md border-2 border-line bg-surface text-sm text-ink-muted focus:outline-none focus:border-focus"
          >
            <option value="" disabled>
              Jump to chapter…
            </option>
            {grammarChapters.map(ch => (
              <option key={ch.number} value={ch.number}>
                Kappale {ch.number} — {ch.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-8">
          <aside className="hidden lg:block w-48 shrink-0">
            <GrammarTOC chapters={grammarChapters} onJump={jump} />
          </aside>

          <div className="flex-1 space-y-4 min-w-0">
            {grammarChapters.map(ch => (
              <ChapterSection
                key={ch.number}
                chapter={ch}
                isOpen={open.has(ch.number)}
                onToggle={() => toggle(ch.number)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
