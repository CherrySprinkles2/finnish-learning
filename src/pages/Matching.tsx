import { useState, useMemo, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { Word } from '../types'
import { getWords } from '../lib/store'

const UNCATEGORISED = 'Uncategorised'
const ROUND_SIZE = 6 // pairs per round — small enough to scan, big enough to feel like a puzzle

function categoryKey(w: Word) {
  return w.category?.trim() || UNCATEGORISED
}

// Show only the first variant on a tile (e.g. "koira / peni" → "koira") to keep tiles compact.
function primary(s: string) {
  return s.split('/')[0].trim()
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

export default function Matching() {
  const [words] = useState<Word[]>(() => getWords())
  const [params] = useSearchParams()
  const selected = params.get('category') // null = no selection; '' = Uncategorised

  if (selected === null) {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center p-8">
        <p className="text-ink-muted text-lg mb-6">Pick a group to play.</p>
        <Link to="/words" className="text-accent hover:underline">← Choose a group</Link>
      </div>
    )
  }

  const label = selected === '' ? UNCATEGORISED : selected
  const deck = words.filter(w => (selected === '' ? !w.category : categoryKey(w) === selected))
  return <Game key={selected} label={label} category={selected} words={deck} />
}

type Side = 'fi' | 'en'
interface Selection { side: Side; id: number }

function Game({ label, category, words }: { label: string; category: string; words: Word[] }) {
  const [gen, setGen] = useState(0) // bump to reshuffle the whole game
  const [roundIndex, setRoundIndex] = useState(0)
  const [matched, setMatched] = useState<Set<number>>(new Set())
  const [selection, setSelection] = useState<Selection | null>(null)
  const [wrong, setWrong] = useState<number[]>([]) // ids flashing red
  const [mistakes, setMistakes] = useState(0)

  const byId = useMemo(() => new Map(words.map(w => [w.id, w])), [words])

  // Split the deck into rounds; reshuffled whenever the game restarts (gen).
  const rounds = useMemo(
    () => chunk(shuffle(words), ROUND_SIZE),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [words, gen],
  )
  const round = rounds[roundIndex] ?? []

  // Each column is shuffled independently so the answer isn't sitting across from its prompt.
  const leftOrder = useMemo(() => shuffle(round.map(w => w.id)), [round])
  const rightOrder = useMemo(() => shuffle(round.map(w => w.id)), [round])

  const roundComplete = round.length > 0 && matched.size === round.length
  const isLastRound = roundIndex >= rounds.length - 1

  const nextRound = useCallback(() => {
    setMatched(new Set())
    setSelection(null)
    setWrong([])
    setRoundIndex(i => i + 1)
  }, [])

  const restart = useCallback(() => {
    setMatched(new Set())
    setSelection(null)
    setWrong([])
    setMistakes(0)
    setRoundIndex(0)
    setGen(g => g + 1)
  }, [])

  function handleTile(side: Side, id: number) {
    if (matched.has(id) || wrong.length > 0) return

    if (!selection) {
      setSelection({ side, id })
      return
    }
    // Clicking the same column just moves (or clears) the selection.
    if (selection.side === side) {
      setSelection(selection.id === id ? null : { side, id })
      return
    }
    // Opposite column → evaluate the pair.
    if (selection.id === id) {
      setMatched(prev => new Set(prev).add(id))
      setSelection(null)
    } else {
      setMistakes(m => m + 1)
      setWrong([selection.id, id])
      setSelection(null)
      setTimeout(() => setWrong([]), 650)
    }
  }

  if (words.length < 2) {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center p-8 text-center">
        <p className="text-ink-muted text-lg mb-6">
          “{label}” needs at least 2 words to play matching.
        </p>
        <Link to={`/study?category=${encodeURIComponent(category)}`} className="text-accent hover:underline">
          ← Back to study options
        </Link>
      </div>
    )
  }

  function tileClass(side: Side, id: number) {
    const base =
      'min-h-[3.5rem] px-3 py-3 rounded-lg border-2 font-medium text-center break-words transition-all select-none'
    if (matched.has(id)) {
      return `${base} bg-success-subtle border-success text-success opacity-60 cursor-default`
    }
    if (wrong.includes(id)) {
      return `${base} bg-danger-subtle border-danger text-danger`
    }
    if (selection && selection.side === side && selection.id === id) {
      return `${base} bg-accent-subtle border-focus text-accent`
    }
    const tint = side === 'fi' ? 'text-warning' : 'text-info'
    return `${base} bg-surface border-line ${tint} hover:border-line-strong active:scale-95 cursor-pointer`
  }

  return (
    <div className="min-h-screen bg-base flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 gap-3">
          <Link
            to={`/study?category=${encodeURIComponent(category)}`}
            className="text-sm text-accent hover:underline shrink-0"
          >
            ← Study
          </Link>
          <span className="font-semibold text-ink truncate">{label}</span>
          <span className="text-sm text-ink-faint tabular-nums shrink-0">
            Round {Math.min(roundIndex + 1, rounds.length)} / {rounds.length}
          </span>
        </div>

        {/* Round progress */}
        <div className="h-1.5 bg-inset rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${round.length ? (matched.size / round.length) * 100 : 0}%` }}
          />
        </div>

        {roundComplete ? (
          <div className="bg-surface rounded-xl border border-line shadow-lg p-10 text-center">
            <div className="text-h2 mb-3">{isLastRound ? '🎉' : '👍'}</div>
            <h2 className="text-h4 font-display font-bold text-ink mb-2">
              {isLastRound ? 'Group complete!' : 'Round complete'}
            </h2>
            <p className="text-ink-muted mb-8">
              {mistakes === 0 ? 'Flawless — no mistakes.' : `${mistakes} mistake${mistakes === 1 ? '' : 's'} so far.`}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {!isLastRound ? (
                <button
                  onClick={nextRound}
                  className="px-6 py-3 rounded-lg bg-accent text-on-accent font-semibold hover:bg-accent-hover active:scale-95 transition-all"
                >
                  Next round →
                </button>
              ) : (
                <button
                  onClick={restart}
                  className="px-6 py-3 rounded-lg bg-accent text-on-accent font-semibold hover:bg-accent-hover active:scale-95 transition-all"
                >
                  Play again
                </button>
              )}
              <Link
                to={`/study?category=${encodeURIComponent(category)}`}
                className="px-6 py-3 rounded-lg bg-surface border-2 border-line text-ink-muted font-semibold hover:border-line-strong transition-all"
              >
                Other modes
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Finnish column */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-ink-faint text-center mb-1">
                  Finnish
                </span>
                {leftOrder.map(id => (
                  <button key={id} onClick={() => handleTile('fi', id)} className={tileClass('fi', id)}>
                    {primary(byId.get(id)!.finnish)}
                  </button>
                ))}
              </div>
              {/* English column */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-ink-faint text-center mb-1">
                  English
                </span>
                {rightOrder.map(id => (
                  <button key={id} onClick={() => handleTile('en', id)} className={tileClass('en', id)}>
                    {primary(byId.get(id)!.english)}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-center text-sm text-ink-faint mt-6">
              Tap a Finnish word, then its English match.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
