import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Word } from '../types'
import { getWords, updateWord, deleteWord as storeDeleteWord, getDisabledCategories, setCategoryDisabled } from '../lib/store'
import ChipEditor from '../components/ChipEditor'

function EyeIcon({ off }: { off: boolean }) {
  return off ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

interface EditState {
  id: number
  english: string[]
  finnish: string[]
  category: string
}

const UNCATEGORISED = 'Uncategorised'

function parseChips(s: string) {
  return s.split('/').map(c => c.trim()).filter(Boolean)
}

interface Group {
  category: string
  words: Word[]
}

function groupWords(words: Word[]): Group[] {
  const groups: Group[] = []
  const index = new Map<string, number>()
  for (const w of words) {
    const key = w.category?.trim() || UNCATEGORISED
    if (!index.has(key)) {
      index.set(key, groups.length)
      groups.push({ category: key, words: [] })
    }
    groups[index.get(key)!].words.push(w)
  }
  // Always show "Uncategorised" last.
  const i = groups.findIndex(g => g.category === UNCATEGORISED)
  if (i !== -1 && i !== groups.length - 1) groups.push(groups.splice(i, 1)[0])
  return groups
}

function AccuracyBadge({ correct, total }: { correct: number; total: number }) {
  if (total === 0) return <span className="text-ink-faint">—</span>
  const pct = Math.round((correct / total) * 100)
  const color =
    pct >= 80 ? 'bg-success-subtle text-success' :
    pct >= 50 ? 'bg-warning-subtle text-warning' :
                'bg-danger-subtle text-danger'
  return <span className={`px-2 py-0.5 rounded-xs text-sm font-medium ${color}`}>{pct}%</span>
}

export default function Words() {
  const [words, setWords] = useState<Word[]>(() => getWords())
  const [editing, setEditing] = useState<EditState | null>(null)
  const [open, setOpen] = useState<Set<string>>(new Set())
  const [disabled, setDisabled] = useState<Set<string>>(() => new Set(getDisabledCategories()))

  function toggleDisabled(cat: string) {
    setCategoryDisabled(cat, !disabled.has(cat))
    setDisabled(new Set(getDisabledCategories()))
  }

  function fetchWords() {
    setWords(getWords())
  }

  const groups = groupWords(words)
  const categoryNames = groups.map(g => g.category).filter(c => c !== UNCATEGORISED)

  function toggle(cat: string) {
    setOpen(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  function saveEdit() {
    if (!editing) return
    updateWord(editing.id, {
      english: editing.english.join(' / '),
      finnish: editing.finnish.join(' / '),
      category: editing.category,
    })
    setEditing(null)
    fetchWords()
  }

  function deleteWord(id: number) {
    storeDeleteWord(id)
    fetchWords()
  }

  return (
    <div className="min-h-screen bg-base p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8 gap-3">
          <h1 className="text-h3 font-display font-bold text-ink">Vocabulary</h1>
          <div className="flex items-center gap-2 text-sm">
            {groups.length > 0 && (
              <>
                <button
                  onClick={() => setOpen(new Set(groups.map(g => g.category)))}
                  className="px-3 py-1.5 rounded-sm text-ink-muted hover:bg-overlay transition-colors"
                >
                  Expand all
                </button>
                <button
                  onClick={() => setOpen(new Set())}
                  className="px-3 py-1.5 rounded-sm text-ink-muted hover:bg-overlay transition-colors"
                >
                  Collapse all
                </button>
              </>
            )}
            <Link
              to="/words/add"
              className="px-4 py-1.5 rounded-sm bg-accent text-on-accent font-medium hover:bg-accent-hover transition-colors whitespace-nowrap"
            >
              + Add vocabulary
            </Link>
          </div>
        </div>

        <datalist id="category-list">
          {categoryNames.map(c => <option key={c} value={c} />)}
        </datalist>

        {words.length === 0 ? (
          <p className="text-ink-faint text-center py-16">No words yet — use “+ Add vocabulary” to get started.</p>
        ) : (
          <div className="space-y-3">
            {groups.map(group => {
              const isOpen = open.has(group.category)
              const isHidden = disabled.has(group.category)
              const total = group.words.reduce((s, w) => s + w.total_attempts, 0)
              const correct = group.words.reduce((s, w) => s + w.correct_count, 0)
              return (
                <div key={group.category} className="bg-surface rounded-lg border border-line shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-3.5">
                    <button
                      onClick={() => toggle(group.category)}
                      className={`flex items-center gap-3 flex-1 text-left min-w-0 transition-opacity ${isHidden ? 'opacity-50' : ''}`}
                    >
                      <span className={`text-ink-faint text-lg transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}>⌄</span>
                      <span className="font-semibold text-ink truncate">{group.category}</span>
                      {isHidden && (
                        <span className="shrink-0 px-1.5 py-0.5 rounded-xs bg-overlay text-ink-faint text-xs font-medium uppercase tracking-wider">Hidden</span>
                      )}
                      <span className="text-sm text-ink-faint shrink-0">{group.words.length} words</span>
                      <AccuracyBadge correct={correct} total={total} />
                    </button>
                    <button
                      onClick={() => toggleDisabled(group.category)}
                      title={isHidden ? 'Hidden from Practice & Progress — click to show' : 'Hide from Practice & Progress'}
                      aria-label={isHidden ? `Show ${group.category} in Practice and Progress` : `Hide ${group.category} from Practice and Progress`}
                      aria-pressed={isHidden}
                      className={`shrink-0 p-1.5 rounded-sm transition-colors hover:bg-overlay ${isHidden ? 'text-ink-faint hover:text-ink' : 'text-ink-muted hover:text-ink'}`}
                    >
                      <EyeIcon off={isHidden} />
                    </button>
                    <Link
                      to={`/study?category=${encodeURIComponent(group.category === UNCATEGORISED ? '' : group.category)}`}
                      className="shrink-0 px-3 py-1.5 rounded-sm bg-accent-subtle text-accent text-sm font-medium hover:bg-accent-muted transition-colors"
                    >
                      Study →
                    </Link>
                  </div>

                  {isOpen && (
                    <div className="border-t border-line-subtle overflow-x-auto">
                      <table className="w-full text-body">
                        <thead className="bg-base text-ink-muted text-sm uppercase tracking-wider border-b border-line">
                          <tr>
                            <th className="text-left px-5 py-2.5 font-medium">English</th>
                            <th className="text-left px-5 py-2.5 font-medium">Finnish</th>
                            <th className="text-left px-5 py-2.5 font-medium">Attempts</th>
                            <th className="text-left px-5 py-2.5 font-medium">Correct</th>
                            <th className="text-left px-5 py-2.5 font-medium">Last tried</th>
                            <th className="px-5 py-2.5"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line-subtle">
                          {group.words.map(w => (
                            <tr key={w.id} className="hover:bg-base">
                              {editing?.id === w.id ? (
                                <>
                                  <td className="px-3 py-2">
                                    <ChipEditor
                                      chips={editing.english}
                                      onChange={chips => setEditing({ ...editing, english: chips })}
                                      placeholder="English…"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <ChipEditor
                                      chips={editing.finnish}
                                      onChange={chips => setEditing({ ...editing, finnish: chips })}
                                      placeholder="Finnish…"
                                    />
                                  </td>
                                  <td colSpan={2} className="px-3 py-2">
                                    <input
                                      value={editing.category}
                                      onChange={e => setEditing({ ...editing, category: e.target.value })}
                                      placeholder="Category…"
                                      list="category-list"
                                      className="w-full border border-focus rounded-xs px-2 py-1.5 text-sm focus:outline-none"
                                    />
                                  </td>
                                  <td colSpan={2} className="px-3 py-2 text-right whitespace-nowrap">
                                    <button onClick={saveEdit} className="text-accent hover:text-accent-emphasis text-sm mr-3">Save</button>
                                    <button onClick={() => setEditing(null)} className="text-ink-faint hover:text-ink-muted text-sm">Cancel</button>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="px-5 py-3">
                                    <div className="flex flex-wrap gap-1">
                                      {parseChips(w.english).map((chip, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-info-subtle text-info text-sm font-medium rounded-xs">{chip}</span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="px-5 py-3">
                                    <div className="flex flex-wrap gap-1">
                                      {parseChips(w.finnish).map((chip, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-warning-subtle text-warning text-sm font-medium rounded-xs">{chip}</span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="px-5 py-3 text-ink-muted">{w.total_attempts}</td>
                                  <td className="px-5 py-3">
                                    <AccuracyBadge correct={w.correct_count} total={w.total_attempts} />
                                  </td>
                                  <td className="px-5 py-3 text-ink-muted">
                                    {w.last_attempted
                                      ? new Date(w.last_attempted + 'Z').toLocaleDateString()
                                      : '—'}
                                  </td>
                                  <td className="px-5 py-3 text-right whitespace-nowrap">
                                    <button
                                      onClick={() => setEditing({ id: w.id, english: parseChips(w.english), finnish: parseChips(w.finnish), category: w.category ?? '' })}
                                      className="text-ink-faint hover:text-accent transition-colors text-sm mr-3"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => deleteWord(w.id)}
                                      className="text-ink-faint hover:text-danger transition-colors text-sm"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
