import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { Word, Direction } from '../types'

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
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)
  const [params] = useSearchParams()
  const selected = params.get('category') // null = no selection yet; '' = Uncategorised

  useEffect(() => {
    fetch('/api/words')
      .then(res => res.json())
      .then((data: Word[]) => {
        setWords(data)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-line border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  if (selected === null) {
    return <CategoryPicker words={words} />
  }

  const label = selected === '' ? UNCATEGORISED : selected
  const deck = words.filter(w => (selected === '' ? !w.category : categoryKey(w) === selected))
  return <Deck label={label} words={deck} />
}

function CategoryPicker({ words }: { words: Word[] }) {
  // Preserve markdown / insertion order (words arrive id-ascending).
  const groups: { key: string; count: number }[] = []
  const seen = new Map<string, number>()
  for (const w of words) {
    const key = categoryKey(w)
    if (!seen.has(key)) {
      seen.set(key, groups.length)
      groups.push({ key, count: 0 })
    }
    groups[seen.get(key)!].count++
  }
  const u = groups.findIndex(g => g.key === UNCATEGORISED)
  if (u !== -1 && u !== groups.length - 1) groups.push(groups.splice(u, 1)[0])

  return (
    <div className="min-h-screen bg-base p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-h3 font-display font-bold text-ink mb-2">Flashcards</h1>
        <p className="text-ink-faint mb-8">Pick a group to study.</p>
        {groups.length === 0 ? (
          <p className="text-ink-faint text-center py-16">No words yet — add some in the Vocabulary section.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map(g => (
              <Link
                key={g.key}
                to={`/flashcards?category=${encodeURIComponent(g.key === UNCATEGORISED ? '' : g.key)}`}
                className="bg-surface rounded-lg border border-line shadow-sm p-5 hover:shadow-md hover:border-accent transition-all"
              >
                <span className="block font-semibold text-ink truncate">{g.key}</span>
                <span className="text-sm text-ink-faint">{g.count} words</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Deck({ label, words }: { label: string; words: Word[] }) {
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
        <Link to="/flashcards" className="text-accent hover:underline">← Back to groups</Link>
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
          <Link to="/flashcards" className="text-sm text-accent hover:underline">← Groups</Link>
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
