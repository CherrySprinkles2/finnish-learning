import { useState, useMemo, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { Word, Direction } from '../types'
import { getWords } from '../lib/store'

const UNCATEGORISED = 'Uncategorised'
const OPTION_COUNT = 4 // one correct + three distractors

function categoryKey(w: Word) {
  return w.category?.trim() || UNCATEGORISED
}

// Show only the first variant (e.g. "koira / peni" → "koira") to keep options compact.
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

// In fi_to_en the Finnish word is shown and the English answer is wanted; en_to_fi is the reverse.
function sourceField(w: Word, dir: Direction) {
  return dir === 'fi_to_en' ? w.finnish : w.english
}
function targetField(w: Word, dir: Direction) {
  return dir === 'fi_to_en' ? w.english : w.finnish
}

export default function Quiz() {
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
  return <Game key={selected} label={label} category={selected} deck={deck} pool={words} />
}

interface Question {
  word: Word
  direction: Direction
  prompt: string
  options: string[]
  correctIndex: number
}

// Build the four options for one word: its correct translation plus up to three plausible
// distractors drawn first from the same category, then topped up from the global pool.
function buildOptions(word: Word, direction: Direction, deck: Word[], pool: Word[]): Question {
  const correct = primary(targetField(word, direction))
  const used = new Set([correct])
  const distractors: string[] = []

  const take = (candidates: Word[]) => {
    for (const w of shuffle(candidates)) {
      if (distractors.length >= OPTION_COUNT - 1) break
      if (w.id === word.id) continue
      const s = primary(targetField(w, direction))
      if (used.has(s)) continue // de-dupe by display string, not id (synonyms can collide)
      used.add(s)
      distractors.push(s)
    }
  }

  take(deck) // prefer same-category distractors so the choices stay plausible
  if (distractors.length < OPTION_COUNT - 1) take(pool) // top up from everywhere if the category is small

  const options = shuffle([correct, ...distractors])
  return {
    word,
    direction,
    prompt: primary(sourceField(word, direction)),
    options,
    correctIndex: options.indexOf(correct),
  }
}

function Game({
  label,
  category,
  deck,
  pool,
}: {
  label: string
  category: string
  deck: Word[]
  pool: Word[]
}) {
  const [gen, setGen] = useState(0) // bump to reshuffle the whole quiz
  const [index, setIndex] = useState(0)
  const [chosen, setChosen] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [misses, setMisses] = useState<{ q: Question; chosen: number }[]>([]) // wrong answers, for the end-of-quiz review

  // One question per word, every word tested once per pass; reshuffled on restart (gen).
  const questions = useMemo(
    () =>
      shuffle(deck).map(w =>
        buildOptions(w, Math.random() < 0.5 ? 'fi_to_en' : 'en_to_fi', deck, pool),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deck, gen],
  )

  const q = questions[index]
  const answered = chosen !== null
  const isLast = index >= questions.length - 1
  const finished = index >= questions.length

  const answer = useCallback(
    (i: number) => {
      if (chosen !== null || !q) return
      setChosen(i)
      if (i === q.correctIndex) setScore(s => s + 1)
      else setMisses(m => [...m, { q, chosen: i }])
    },
    [chosen, q],
  )

  const next = useCallback(() => {
    setChosen(null)
    setIndex(i => i + 1)
  }, [])

  const restart = useCallback(() => {
    setChosen(null)
    setScore(0)
    setMisses([])
    setIndex(0)
    setGen(g => g + 1)
  }, [])

  // Keyboard: 1–4 pick an option, Enter advances once answered.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (finished || !q) return
      if (e.key === 'Enter') {
        if (answered && !isLast) next()
        return
      }
      const n = Number(e.key)
      if (!answered && n >= 1 && n <= q.options.length) answer(n - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answered, finished, isLast, q, answer, next])

  if (deck.length < 2) {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center p-8 text-center">
        <p className="text-ink-muted text-lg mb-6">
          “{label}” needs at least 2 words for multiple choice.
        </p>
        <Link to={`/study?category=${encodeURIComponent(category)}`} className="text-accent hover:underline">
          ← Back to study options
        </Link>
      </div>
    )
  }

  if (finished) {
    const total = questions.length
    const pct = total ? Math.round((score / total) * 100) : 0
    return (
      <div className="min-h-screen bg-base flex flex-col items-center p-4 sm:p-8">
        <div className="w-full max-w-2xl">
          <div className="bg-surface rounded-xl border border-line shadow-lg p-10 text-center">
            <div className="text-h2 mb-3">{pct === 100 ? '🎉' : '✅'}</div>
            <h2 className="text-h4 font-display font-bold text-ink mb-2">Quiz complete!</h2>
            <p className="text-ink-muted mb-8">
              You scored <span className="text-ink font-semibold tabular-nums">{score} / {total}</span> ({pct}%).
            </p>

            {misses.length > 0 && (
              <div className="text-left mb-8">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-faint mb-3 text-center">
                  Review your mistakes
                </h3>
                <ul className="flex flex-col gap-2">
                  {misses.map(({ q, chosen }, i) => (
                    <li key={i} className="bg-inset rounded-lg border border-line-subtle p-3">
                      <span className={`block font-display font-semibold break-words ${q.direction === 'fi_to_en' ? 'text-warning' : 'text-info'}`}>
                        {q.prompt}
                      </span>
                      <span className="block text-sm text-success mt-1 break-words">
                        ✓ {q.options[q.correctIndex]}
                      </span>
                      <span className="block text-sm text-danger break-words">
                        ✗ {q.options[chosen]}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={restart}
                className="px-6 py-3 rounded-lg bg-accent text-on-accent font-semibold hover:bg-accent-hover active:scale-95 transition-all"
              >
                Play again
              </button>
              <Link
                to={`/study?category=${encodeURIComponent(category)}`}
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

  function optionClass(i: number) {
    const base =
      'w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-left font-medium transition-all'
    if (!answered) {
      return `${base} bg-surface border-line hover:border-line-strong active:scale-[0.99] cursor-pointer`
    }
    if (i === q.correctIndex) {
      return `${base} bg-success-subtle border-success text-success cursor-default`
    }
    if (i === chosen) {
      return `${base} bg-danger-subtle border-danger text-danger cursor-default`
    }
    return `${base} bg-surface border-line-subtle text-ink-faint opacity-60 cursor-default`
  }

  // Prompt colour cues the direction: gold for a Finnish prompt, blue for an English one.
  const promptTint = q.direction === 'fi_to_en' ? 'text-warning' : 'text-info'

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
            Question {index + 1} / {questions.length}
          </span>
        </div>

        {/* Progress */}
        <div className="h-1.5 bg-inset rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${(index / questions.length) * 100}%` }}
          />
        </div>

        {/* Prompt */}
        <div className="bg-surface rounded-xl border border-line p-8 text-center mb-6">
          <span className="block text-xs font-semibold uppercase tracking-widest text-ink-faint mb-3">
            {q.direction === 'fi_to_en' ? 'Finnish → English' : 'English → Finnish'}
          </span>
          <span className={`block text-h3 font-display font-bold break-words ${promptTint}`}>
            {q.prompt}
          </span>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3">
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => answer(i)} disabled={answered} className={optionClass(i)}>
              <span className="shrink-0 w-6 h-6 grid place-items-center rounded-md bg-inset text-ink-faint text-sm font-semibold tabular-nums">
                {i + 1}
              </span>
              <span className="break-words">{opt}</span>
            </button>
          ))}
        </div>

        {/* Advance */}
        <div className="h-16 flex items-center justify-center mt-4">
          {answered &&
            (isLast ? (
              <button
                onClick={next}
                className="px-6 py-3 rounded-lg bg-accent text-on-accent font-semibold hover:bg-accent-hover active:scale-95 transition-all"
              >
                See results →
              </button>
            ) : (
              <button
                onClick={next}
                className="px-6 py-3 rounded-lg bg-accent text-on-accent font-semibold hover:bg-accent-hover active:scale-95 transition-all"
              >
                Next →
              </button>
            ))}
        </div>
      </div>
    </div>
  )
}
