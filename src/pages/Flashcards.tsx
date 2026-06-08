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
  const allIdx = useMemo(() => words.map((_, i) => i), [words])

  // A session is a queue of remaining card indices. "Got it" drops a card; "Still learning"
  // sends it to the back so it comes around again. The session ends when the queue empties.
  // Study-only — no attempts are recorded.
  const [queue, setQueue] = useState<number[]>(() => shuffle(allIdx))
  const [flipped, setFlipped] = useState(false)
  const [doneCount, setDoneCount] = useState(0) // cards cleared with "Got it"
  const [struggledIdx, setStruggledIdx] = useState<Set<number>>(new Set()) // ever marked "Still learning"

  const current = queue[0]
  const card = words[current]
  const total = words.length
  const finished = total > 0 && queue.length === 0

  const start = useCallback((indices: number[]) => {
    setQueue(shuffle(indices))
    setDoneCount(0)
    setStruggledIdx(new Set())
    setFlipped(false)
  }, [])

  const gotIt = useCallback(() => {
    setDoneCount(c => c + 1)
    setQueue(q => q.slice(1))
    setFlipped(false)
  }, [])

  const stillLearning = useCallback(() => {
    setStruggledIdx(prev => new Set(prev).add(current))
    setQueue(q => (q.length > 1 ? [...q.slice(1), q[0]] : q)) // move to the back
    setFlipped(false)
  }, [current])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (finished || !card) return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setFlipped(f => !f)
        return
      }
      if (!flipped) return // sort keys only act on a flipped (answered) card
      if (e.key === 'ArrowRight') gotIt()
      else if (e.key === 'ArrowLeft') stillLearning()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finished, card, flipped, gotIt, stillLearning])

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

  if (finished) {
    const struggled = struggledIdx.size
    const firstTry = total - struggled
    return (
      <div className="min-h-screen bg-base flex flex-col items-center p-8">
        <div className="w-full max-w-2xl">
          <div className="bg-surface rounded-xl border border-line shadow-lg p-10 text-center">
            <div className="text-h2 mb-3">{struggled === 0 ? '🎉' : '👍'}</div>
            <h2 className="text-h4 font-display font-bold text-ink mb-2">Deck complete!</h2>
            <p className="text-ink-muted mb-8">
              You knew <span className="text-ink font-semibold tabular-nums">{firstTry}</span> of{' '}
              <span className="text-ink font-semibold tabular-nums">{total}</span> on the first look
              {struggled > 0 && <> — {struggled} needed another pass.</>}
              {struggled === 0 && <> — flawless.</>}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {struggled > 0 && (
                <button
                  onClick={() => start([...struggledIdx])}
                  className="px-6 py-3 rounded-lg bg-accent text-on-accent font-semibold hover:bg-accent-hover active:scale-95 transition-all"
                >
                  Review the {struggled} tricky one{struggled === 1 ? '' : 's'}
                </button>
              )}
              <button
                onClick={() => start(allIdx)}
                className={`px-6 py-3 rounded-lg font-semibold active:scale-95 transition-all ${
                  struggled > 0
                    ? 'bg-surface border-2 border-line text-ink-muted hover:border-line-strong'
                    : 'bg-accent text-on-accent hover:bg-accent-hover'
                }`}
              >
                Shuffle all again
              </button>
              <Link
                to={studyHref}
                className="px-6 py-3 rounded-lg bg-surface border-2 border-line text-ink-muted font-semibold hover:border-line-strong transition-all"
              >
                Other modes
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const frontLang = direction === 'fi_to_en' ? 'Finnish' : 'English'
  const backLang = direction === 'fi_to_en' ? 'English' : 'Finnish'

  return (
    <div className="min-h-screen bg-base flex flex-col items-center p-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 gap-3">
          <Link to={studyHref} className="text-sm text-accent hover:underline shrink-0">← Study</Link>
          <span className="font-semibold text-ink truncate">{label}</span>
          <button
            onClick={() => { setDirection(d => d === 'fi_to_en' ? 'en_to_fi' : 'fi_to_en'); setFlipped(false) }}
            className="text-sm px-3 py-1.5 rounded-sm bg-surface border border-line text-ink-muted hover:border-line-strong transition-colors shrink-0"
          >
            {frontLang} → {backLang}
          </button>
        </div>

        {/* Progress */}
        <div className="h-1.5 bg-inset rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${(doneCount / total) * 100}%` }}
          />
        </div>
        <p className="text-center text-sm text-ink-faint mb-6 tabular-nums">{queue.length} to go</p>

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

        {/* Self-assessment — only once the answer is showing */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={stillLearning}
            disabled={!flipped}
            className="flex-1 px-5 py-3 rounded-lg bg-surface border-2 border-warning text-warning font-semibold hover:bg-warning-subtle active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Still learning
          </button>
          <button
            onClick={gotIt}
            disabled={!flipped}
            className="flex-1 px-5 py-3 rounded-lg bg-surface border-2 border-success text-success font-semibold hover:bg-success-subtle active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Got it →
          </button>
        </div>

        <p className="text-center text-sm text-ink-faint mt-6">
          {flipped ? '← Still learning · Got it →' : 'Space / Enter to flip'}
        </p>
      </div>
    </div>
  )
}
