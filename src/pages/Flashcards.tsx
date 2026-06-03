import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import type { Word, Direction } from '../types'
import { getWords } from '../lib/store'

const UNCATEGORISED = 'Uncategorised'

function categoryKey(w: Word) {
  return w.category?.trim() || UNCATEGORISED
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Flashcards() {
  const [words] = useState<Word[]>(() => getWords())
  const [params] = useSearchParams()
  const selected = params.get('category') // null = no selection yet; '' = Uncategorised

  // No category → nothing to flip; send the user back to the vocabulary list.
  if (selected === null) {
    return <Navigate to="/words" replace />
  }

  const label = selected === '' ? UNCATEGORISED : selected
  const deck = words.filter(w => (selected === '' ? !w.category : categoryKey(w) === selected))
  return <Deck label={label} category={selected} words={deck} />
}

function Deck({ label, category, words }: { label: string; category: string; words: Word[] }) {
  const studyHref = `/study?category=${encodeURIComponent(category)}`
  const [direction, setDirection] = useState<Direction>('fi_to_en')
  const [order, setOrder] = useState<number[]>(() => words.map((_, i) => i))
  const [pos, setPos] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const card = words[order[pos]]

  const go = useCallback(
    (delta: number) => {
      setFlipped(false)
      setPos(p => (p + delta + order.length) % order.length)
    },
    [order.length],
  )

  const reshuffle = useCallback(() => {
    setOrder(shuffle(words.map((_, i) => i)))
    setPos(0)
    setFlipped(false)
  }, [words])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setFlipped(f => !f)
      } else if (e.key === 'ArrowRight') {
        go(1)
      } else if (e.key === 'ArrowLeft') {
        go(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go])

  const front = useMemo(() => {
    if (!card) return []
    const raw = direction === 'fi_to_en' ? card.finnish : card.english
    return raw.split('/').map(s => s.trim()).filter(Boolean)
  }, [card, direction])

  const back = useMemo(() => {
    if (!card) return []
    const raw = direction === 'fi_to_en' ? card.english : card.finnish
    return raw.split('/').map(s => s.trim()).filter(Boolean)
  }, [card, direction])

  if (words.length === 0) {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center p-8">
        <p className="text-ink-muted text-lg mb-6">No words in “{label}” yet.</p>
        <Link to={studyHref} className="text-accent hover:underline">← Back to study options</Link>
      </div>
    )
  }

  const frontLang = direction === 'fi_to_en' ? 'Finnish' : 'English'
  const backLang = direction === 'fi_to_en' ? 'English' : 'Finnish'

  return (
    <div className="min-h-screen bg-base flex flex-col items-center p-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to={studyHref} className="text-sm text-accent hover:underline">← Study</Link>
          <span className="font-semibold text-ink">{label}</span>
          <button
            onClick={() => { setDirection(d => d === 'fi_to_en' ? 'en_to_fi' : 'fi_to_en'); setFlipped(false) }}
            className="text-sm px-3 py-1.5 rounded-sm bg-surface border border-line text-ink-muted hover:border-line-strong transition-colors"
          >
            {frontLang} → {backLang}
          </button>
        </div>

        {/* Card */}
        <button
          onClick={() => setFlipped(f => !f)}
          className="w-full min-h-[16rem] bg-surface rounded-xl shadow-lg border border-line-subtle p-10 flex flex-col items-center justify-center text-center mb-6 hover:shadow-xl transition-shadow"
        >
          <span className="text-xs font-semibold uppercase tracking-widest text-ink-faint mb-4">
            {flipped ? backLang : frontLang}
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            {(flipped ? back : front).map((chip, i, arr) => (
              <span key={i} className="flex items-baseline gap-x-3">
                <span className="text-h2 font-display font-bold text-ink tracking-tight">{chip}</span>
                {i < arr.length - 1 && <span className="text-h3 font-light text-ink-disabled">/</span>}
              </span>
            ))}
          </div>
          {!flipped && <span className="text-sm text-ink-faint mt-6">Click or press Space to flip</span>}
        </button>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => go(-1)}
            className="px-5 py-3 rounded-lg bg-surface border-2 border-line text-ink-muted font-semibold hover:border-line-strong active:scale-95 transition-all"
          >
            ← Prev
          </button>
          <div className="flex flex-col items-center gap-1">
            <span className="text-ink-faint text-sm tabular-nums">{pos + 1} / {words.length}</span>
            <button onClick={reshuffle} className="text-xs text-accent hover:underline">Shuffle</button>
          </div>
          <button
            onClick={() => go(1)}
            className="px-5 py-3 rounded-lg bg-accent text-on-accent font-semibold hover:bg-accent-hover active:scale-95 transition-all"
          >
            Next →
          </button>
        </div>

        <p className="text-center text-sm text-ink-faint mt-6">
          Space / Enter to flip · ← → to navigate
        </p>
      </div>
    </div>
  )
}
