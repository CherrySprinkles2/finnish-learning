import { useState } from 'react'
import type { ExerciseContent, ExerciseItem, ExerciseType } from '../../data/grammar'
import { isLocalMatch } from '../../lib/match'

const TYPE_LABEL: Record<ExerciseType, string> = {
  'fill-blank': 'Fill in',
  conjugation: 'Conjugate',
  'multiple-choice': 'Choose',
  translate: 'Translate',
  identify: 'Identify',
}

export default function ExerciseBlock({ content }: { content: ExerciseContent }) {
  return (
    <div className="rounded-md border border-line bg-surface">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-line-subtle bg-base rounded-t-md">
        <span className="text-sm">📝</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Test yourself
        </span>
      </div>
      <div className="divide-y divide-line-subtle">
        {content.items.map((item, i) => (
          <ExerciseItemView key={i} item={item} />
        ))}
      </div>
    </div>
  )
}

function ExerciseItemView({ item }: { item: ExerciseItem }) {
  const hasOptions = item.options && item.options.length > 0
  const revealOnly = item.revealOnly || (!item.answer && !hasOptions)

  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-2 mb-2">
        <span className="shrink-0 px-1.5 py-0.5 rounded-xs bg-overlay text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
          {TYPE_LABEL[item.type]}
        </span>
        <p className="text-sm text-ink-muted">{item.prompt}</p>
      </div>
      {hasOptions ? (
        <ChoiceItem item={item} />
      ) : revealOnly ? (
        <RevealItem item={item} />
      ) : (
        <TypedItem item={item} />
      )}
    </div>
  )
}

function Note({ text }: { text?: string }) {
  if (!text) return null
  return <p className="mt-2 text-xs text-ink-faint">{text}</p>
}

// ── Typed input (fill-blank, translate with answer) ──────────────────────────
function TypedItem({ item }: { item: ExerciseItem }) {
  const [value, setValue] = useState('')
  const [checked, setChecked] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const correct = checked && isLocalMatch(value, item.answer ?? '')

  function check() {
    if (!value.trim()) return
    setChecked(true)
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={e => {
            setValue(e.target.value)
            setChecked(false)
            setRevealed(false)
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') check()
          }}
          placeholder="Type your answer…"
          className={`flex-1 px-3 py-1.5 rounded-sm border-2 text-sm focus:outline-none transition-colors ${
            !checked
              ? 'border-line focus:border-focus text-ink'
              : correct
                ? 'border-success bg-success-subtle text-success'
                : 'border-danger bg-danger-subtle text-danger'
          }`}
        />
        <button
          onClick={check}
          className="px-4 py-1.5 rounded-sm bg-accent text-on-accent text-sm font-medium hover:bg-accent-hover active:scale-95 transition-all"
        >
          Check
        </button>
      </div>
      {checked && (
        <div className="mt-2 text-sm">
          {correct ? (
            <p className="text-success font-medium">✓ Correct</p>
          ) : (
            <div className="space-y-1">
              <p className="text-danger font-medium">✗ Not quite</p>
              {revealed ? (
                <p className="text-ink-muted">
                  Answer:{' '}
                  <span className="font-semibold text-ink">{item.answer}</span>
                </p>
              ) : (
                <button
                  onClick={() => setRevealed(true)}
                  className="text-accent hover:underline text-xs font-medium"
                >
                  Show answer
                </button>
              )}
            </div>
          )}
        </div>
      )}
      <Note text={item.note} />
    </div>
  )
}

// ── Reveal-only (conjugation paradigms, free translations) ───────────────────
function RevealItem({ item }: { item: ExerciseItem }) {
  const [revealed, setRevealed] = useState(false)

  if (!revealed) {
    return (
      <button
        onClick={() => setRevealed(true)}
        className="px-4 py-1.5 rounded-sm border-2 border-line text-ink-muted text-sm font-medium hover:border-line-strong hover:text-ink-muted active:scale-95 transition-all"
      >
        Show answer
      </button>
    )
  }

  return (
    <div>
      <pre className="rounded-sm bg-base border border-line px-3 py-2 text-sm text-ink font-mono whitespace-pre-wrap">
        {item.answer}
      </pre>
      <Note text={item.note} />
    </div>
  )
}

// ── Multiple-choice / identify ───────────────────────────────────────────────
function ChoiceItem({ item }: { item: ExerciseItem }) {
  const [selected, setSelected] = useState<number | null>(null)
  const answered = selected !== null

  return (
    <div>
      <div className="flex flex-col gap-1.5">
        {item.options!.map((opt, i) => {
          const isCorrect = i === item.correctOption
          const isSelected = i === selected
          let style = 'border-line text-ink-muted hover:border-line-strong'
          if (answered && isCorrect) style = 'border-success bg-success-subtle text-success'
          else if (answered && isSelected && !isCorrect) style = 'border-danger bg-danger-subtle text-danger'
          else if (answered) style = 'border-line text-ink-faint'
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => setSelected(i)}
              className={`text-left px-3 py-1.5 rounded-sm border-2 text-sm transition-colors disabled:cursor-default ${style}`}
            >
              {answered && isCorrect && '✓ '}
              {answered && isSelected && !isCorrect && '✗ '}
              {opt}
            </button>
          )
        })}
      </div>
      {answered && <Note text={item.note} />}
    </div>
  )
}
