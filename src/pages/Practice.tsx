import { useState, useEffect, useRef } from 'react'
import type { PracticeWord } from '../types'
import { isLocalMatch } from '../lib/match'

type Status = 'idle' | 'checking' | 'correct' | 'wrong'

export default function Practice() {
  const [word, setWord] = useState<PracticeWord | null>(null)
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(true)
  const [empty, setEmpty] = useState(false)
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([])
  const [category, setCategory] = useState('')  // '' = all categories
  const [mode, setMode] = useState<'all' | 'mistakes'>('all')
  const lastIdRef = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)  // click target only, never auto-focused

  async function fetchWord() {
    setLoading(true)
    setAnswer('')
    setStatus('idle')
    setFeedback('')
    const params = new URLSearchParams()
    if (lastIdRef.current !== null) params.set('exclude', String(lastIdRef.current))
    if (category) params.set('category', category)
    if (mode === 'mistakes') params.set('mode', 'mistakes')
    const qs = params.toString()
    const res = await fetch(`/api/practice${qs ? `?${qs}` : ''}`)
    const data = await res.json()
    if (!data) {
      setEmpty(true)
    } else {
      setWord(data)
      lastIdRef.current = data.id
      setEmpty(false)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetch('/api/categories').then(res => res.json()).then(setCategories)
  }, [])

  // Refetch a word whenever the chosen category or mode changes (and on mount).
  useEffect(() => {
    lastIdRef.current = null
    fetchWord()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, mode])

  useEffect(() => {
    if (!loading) inputRef.current?.focus()
  }, [loading, status])

  async function giveUp() {
    if (!word) return
    setStatus('wrong')
    setFeedback('')
    await fetch('/api/attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word_id: word.id, direction: word.direction, correct: false }),
    })
  }

  async function submit() {
    if (!word || !answer.trim()) return
    setFeedback('')

    const reference = word.direction === 'en_to_fi' ? word.finnish : word.english

    if (isLocalMatch(answer, reference)) {
      setStatus('correct')
      await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word_id: word.id, direction: word.direction, correct: true }),
      })
      return
    }

    setStatus('checking')
    const prompt = word.direction === 'en_to_fi' ? word.english : word.finnish

    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, user_answer: answer.trim(), reference, direction: word.direction, word_id: word.id }),
      })
      const { correct, feedback: fb } = await res.json()
      setStatus(correct ? 'correct' : 'wrong')
      if (fb) setFeedback(fb)
      await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word_id: word.id, direction: word.direction, correct }),
      })
    } catch {
      setStatus('idle')
    }
  }

  if (loading) {
    return (
      <Screen>
        <div className="w-10 h-10 border-4 border-line border-t-accent rounded-full animate-spin" />
      </Screen>
    )
  }

  if (empty) {
    if (mode === 'mistakes') {
      return (
        <Screen>
          <p className="text-ink-muted text-lg mb-6">No mistakes to review 🎉</p>
          <button
            onClick={() => setMode('all')}
            className="px-8 py-3 bg-accent text-on-accent font-medium rounded-md hover:bg-accent-hover transition-colors"
          >
            Practise all words →
          </button>
        </Screen>
      )
    }
    return (
      <Screen>
        <p className="text-ink-muted text-lg mb-6">No words in your list yet.</p>
        <a href="/words" className="px-8 py-3 bg-accent text-on-accent font-medium rounded-md hover:bg-accent-hover transition-colors">
          Add words →
        </a>
      </Screen>
    )
  }

  if (!word) return null

  const promptRaw = word.direction === 'en_to_fi' ? word.english : word.finnish
  const promptLang = word.direction === 'en_to_fi' ? 'English' : 'Finnish'
  const answerLang = word.direction === 'en_to_fi' ? 'Finnish' : 'English'
  const correctAnswer = word.direction === 'en_to_fi' ? word.finnish : word.english
  const promptChips = promptRaw.split('/').map(s => s.trim()).filter(Boolean)
  const answerChips = correctAnswer.split('/').map(s => s.trim()).filter(Boolean)

  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-3xl">

        {/* Direction + category */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-10">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-accent-muted text-accent text-sm font-semibold rounded-full">{promptLang}</span>
            <span className="text-ink-faint text-lg">→</span>
            <span className="px-3 py-1 bg-overlay text-ink-muted text-sm font-semibold rounded-full">{answerLang}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center p-1 bg-overlay rounded-sm">
              <button
                onClick={() => setMode('all')}
                className={`px-3 py-1 text-sm font-semibold rounded-sm transition-colors ${
                  mode === 'all' ? 'bg-surface text-ink shadow-sm' : 'text-ink-faint hover:text-ink-muted'
                }`}
              >
                All words
              </button>
              <button
                onClick={() => setMode('mistakes')}
                className={`px-3 py-1 text-sm font-semibold rounded-sm transition-colors ${
                  mode === 'mistakes' ? 'bg-surface text-ink shadow-sm' : 'text-ink-faint hover:text-ink-muted'
                }`}
              >
                Review mistakes
              </button>
            </div>
            {categories.length > 0 && (
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="px-3 py-1.5 rounded-sm border border-line bg-surface text-sm text-ink-muted focus:outline-none focus:border-focus w-full sm:w-auto sm:max-w-[14rem]"
              >
                <option value="">All categories</option>
                {categories.map(c => (
                  <option key={c.category} value={c.category}>{c.category} ({c.count})</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Word card */}
        <div className="bg-surface rounded-xl shadow-lg border border-line-subtle p-6 sm:p-12 mb-6">
          <div className="mb-8 sm:mb-12">
            {promptChips.length > 1 && (
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint mb-4">Multiple meanings — translate any one</p>
            )}
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
              {promptChips.map((chip, i) => (
                <span key={i} className="flex items-baseline gap-x-4">
                  <span className="text-h1 sm:text-display font-display font-bold text-ink tracking-tight leading-tight">{chip}</span>
                  {i < promptChips.length - 1 && (
                    <span className="text-h2 font-light text-ink-disabled select-none">/</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => {
              if (e.key !== 'Enter') return
              if (status === 'idle') submit()
              else if (status === 'correct' || status === 'wrong') fetchWord()
            }}
            readOnly={status !== 'idle'}
            placeholder={`Type ${answerLang} translation…`}
            className={`w-full text-h3 px-6 py-4 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
              status === 'correct' ? 'border-success bg-success-subtle text-success cursor-default' :
              status === 'wrong'   ? 'border-danger bg-danger-subtle text-danger cursor-default' :
              'border-line focus:border-focus text-ink placeholder:text-ink-faint'
            }`}
          />

          {/* Result feedback */}
          {(status === 'correct' || status === 'wrong') && (
            <div className="mt-6">
              {status === 'correct' && (
                <div className="space-y-2">
                  <p className="text-success font-semibold text-h4">✓ Correct!</p>
                  {answerChips.length > 1 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {answerChips.map((chip, i) => (
                        <span key={i} className="px-2 py-0.5 bg-success-subtle text-success text-sm rounded-xs border border-success">{chip}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {status === 'wrong' && (
                <div className="space-y-2">
                  <p className="text-danger font-semibold text-h4">✗ Not quite</p>
                  {feedback && <p className="text-ink-muted text-body">{feedback}</p>}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-ink-muted text-body">The answer is:</span>
                    {answerChips.map((chip, i) => (
                      <span key={i} className="px-2 py-0.5 bg-overlay text-ink text-sm font-semibold rounded-xs">{chip}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {status === 'checking' && (
            <div className="mt-6 flex items-center gap-3 text-ink-faint text-body">
              <div className="w-5 h-5 border-2 border-line-strong border-t-ink-muted rounded-full animate-spin" />
              Checking your answer…
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-4">
          {status === 'idle' && (
            <>
              <button
                onClick={giveUp}
                className="py-4 px-6 bg-surface text-ink-faint text-lg font-semibold rounded-lg border-2 border-line hover:border-line-strong hover:text-ink-muted active:scale-95 transition-all"
              >
                Don't know
              </button>
              <button
                onClick={submit}
                className="flex-1 py-4 bg-accent text-on-accent text-lg font-semibold rounded-lg hover:bg-accent-hover active:scale-95 transition-all"
              >
                Check answer
              </button>
            </>
          )}
          {(status === 'correct' || status === 'wrong') && (
            <button
              ref={nextRef}
              onClick={fetchWord}
              className="flex-1 py-4 bg-accent text-on-accent text-lg font-semibold rounded-lg hover:bg-accent-hover active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2"
            >
              Next word →
            </button>
          )}
        </div>

        <p className="text-center text-sm text-ink-faint mt-5">Press Enter to check · Enter again to continue</p>
      </div>
    </div>
  )
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center p-8">
      {children}
    </div>
  )
}
