import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { addWord as storeAddWord, addWords, getCategories, getWords } from '../lib/store'
import { generateVocabulary, MAX_GENERATE_ITEMS, type GeneratedWord } from '../lib/ai'
import { hasApiKey } from '../lib/apiKey'
import ChipEditor from '../components/ChipEditor'

interface ReviewRow {
  key: number
  english: string[]
  finnish: string[]
  category: string
  categoryIsNew: boolean
  duplicate: boolean
  include: boolean
}

function parseChips(s: string) {
  return s.split('/').map(c => c.trim()).filter(Boolean)
}

// Lowercased set of every English variant already in the store, for dupe checks.
function existingEnglishVariants(): Set<string> {
  const set = new Set<string>()
  for (const w of getWords()) {
    for (const v of w.english.split('/')) {
      const t = v.trim().toLowerCase()
      if (t) set.add(t)
    }
  }
  return set
}

export default function AddWords() {
  const navigate = useNavigate()
  const keyed = hasApiKey()

  // Existing categories drive both the AI prompt and the review datalist.
  const [existingCategories] = useState(() => getCategories().map(c => c.category))

  // AI bulk flow
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState<ReviewRow[] | null>(null)

  // Manual single-add
  const [mEnglish, setMEnglish] = useState('')
  const [mFinnish, setMFinnish] = useState('')
  const [mCategory, setMCategory] = useState('')
  const [mCatMode, setMCatMode] = useState<'select' | 'new'>('select')
  const [mError, setMError] = useState('')
  const [manualAdded, setManualAdded] = useState(0)
  // New categories created via manual add (existingCategories is captured once).
  const [manualCats, setManualCats] = useState<string[]>([])

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const overLimit = lines.length > MAX_GENERATE_ITEMS

  // Every category we know about: existing + AI-suggested + manually created.
  const knownCategories = (() => {
    const set = new Set(existingCategories)
    for (const r of rows ?? []) if (r.category) set.add(r.category)
    for (const c of manualCats) set.add(c)
    return [...set]
  })()

  async function generate() {
    setError('')
    if (lines.length === 0) {
      setError('Enter at least one English word.')
      return
    }
    setLoading(true)
    try {
      const results = await generateVocabulary(lines, existingCategories)
      if (results.length === 0) {
        setError('No translations came back — try rephrasing or fewer items.')
        setRows(null)
        return
      }
      const existing = existingEnglishVariants()
      const built: ReviewRow[] = results.map((r: GeneratedWord, i) => {
        const english = parseChips(r.english)
        const duplicate = english.some(e => existing.has(e.toLowerCase()))
        return {
          key: i,
          english,
          finnish: parseChips(r.finnish),
          category: r.category,
          categoryIsNew: r.categoryIsNew,
          duplicate,
          include: !duplicate,
        }
      })
      setRows(built)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function updateRow(key: number, patch: Partial<ReviewRow>) {
    setRows(prev => prev?.map(r => (r.key === key ? { ...r, ...patch } : r)) ?? prev)
  }

  function saveReviewed() {
    const toSave = (rows ?? [])
      .filter(r => r.include && r.english.length && r.finnish.length)
      .map(r => ({
        english: r.english.join(' / '),
        finnish: r.finnish.join(' / '),
        category: r.category,
      }))
    addWords(toSave)
    navigate('/words')
  }

  function addManual(e: React.FormEvent) {
    e.preventDefault()
    setMError('')
    if (!mEnglish.trim() || !mFinnish.trim()) {
      setMError('English and Finnish are required.')
      return
    }
    storeAddWord({ english: mEnglish, finnish: mFinnish, category: mCategory })
    const cat = mCategory.trim()
    if (cat && !knownCategories.includes(cat)) setManualCats(prev => [...prev, cat])
    setMEnglish('')
    setMFinnish('')
    // Keep the category selected for the next word; drop back to dropdown mode
    // (the new category is now a known option).
    setMCatMode('select')
    setManualAdded(n => n + 1)
  }

  const includedCount = (rows ?? []).filter(r => r.include).length

  return (
    <div className="min-h-screen bg-base p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8 gap-3">
          <h1 className="text-h3 font-display font-bold text-ink">Add vocabulary</h1>
          <Link to="/words" className="text-sm text-ink-muted hover:text-ink transition-colors">← Back to vocabulary</Link>
        </div>

        <datalist id="add-category-list">
          {knownCategories.map(c => <option key={c} value={c} />)}
        </datalist>

        {/* AI bulk generation */}
        <div className="bg-surface rounded-lg border border-line shadow-sm p-6 mb-6">
          <h2 className="text-body font-semibold text-ink mb-1">Generate with AI</h2>
          <p className="text-sm text-ink-muted mb-4">
            Paste a list of English words — one per line. Claude will translate each into Finnish (with common alternatives) and suggest a category.
          </p>

          {!keyed ? (
            <div className="rounded-sm bg-warning-subtle text-warning text-sm px-4 py-3">
              No API key set. <Link to="/settings" className="underline font-medium">Add your Anthropic key in Settings</Link> to use AI generation — or add words manually below.
            </div>
          ) : (
            <>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={8}
                placeholder={'dog\ncat\nto run\nhouse'}
                className="w-full border border-line-strong rounded-sm px-3 py-2 focus:outline-none focus:border-focus text-body font-mono resize-y"
              />
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <button
                  onClick={generate}
                  disabled={loading || lines.length === 0 || overLimit}
                  className="px-5 py-2 bg-accent text-on-accent rounded-sm hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {loading ? 'Generating…' : `Generate translations${lines.length ? ` (${lines.length})` : ''}`}
                </button>
                {overLimit && (
                  <span className="text-sm text-danger">Max {MAX_GENERATE_ITEMS} at a time — you have {lines.length}.</span>
                )}
                {error && <span className="text-sm text-danger">{error}</span>}
              </div>
            </>
          )}
        </div>

        {/* Review table */}
        {rows && (
          <div className="bg-surface rounded-lg border border-line shadow-sm overflow-hidden mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-line-subtle">
              <div>
                <h2 className="text-body font-semibold text-ink">Review &amp; add</h2>
                <p className="text-sm text-ink-faint mt-0.5">Edit anything before saving. Duplicates are unticked by default.</p>
              </div>
              <button
                onClick={saveReviewed}
                disabled={includedCount === 0}
                className="px-5 py-2 bg-accent text-on-accent rounded-sm hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Add {includedCount} word{includedCount === 1 ? '' : 's'}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-body">
                <thead className="bg-base text-ink-muted text-sm uppercase tracking-wider border-b border-line">
                  <tr>
                    <th className="px-4 py-2.5 font-medium w-10"></th>
                    <th className="text-left px-4 py-2.5 font-medium">English</th>
                    <th className="text-left px-4 py-2.5 font-medium">Finnish</th>
                    <th className="text-left px-4 py-2.5 font-medium">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {rows.map(r => (
                    <tr key={r.key} className={`hover:bg-base ${r.include ? '' : 'opacity-50'}`}>
                      <td className="px-4 py-2 align-top">
                        <input
                          type="checkbox"
                          checked={r.include}
                          onChange={e => updateRow(r.key, { include: e.target.checked })}
                          aria-label="Include this word"
                          className="mt-2 accent-[var(--accent-primary)]"
                        />
                      </td>
                      <td className="px-4 py-2 align-top">
                        <ChipEditor
                          chips={r.english}
                          onChange={chips => updateRow(r.key, { english: chips })}
                          placeholder="English…"
                        />
                        {r.duplicate && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded-xs bg-warning-subtle text-warning text-xs font-medium">Already exists</span>
                        )}
                      </td>
                      <td className="px-4 py-2 align-top">
                        <ChipEditor
                          chips={r.finnish}
                          onChange={chips => updateRow(r.key, { finnish: chips })}
                          placeholder="Finnish…"
                        />
                      </td>
                      <td className="px-4 py-2 align-top">
                        <input
                          value={r.category}
                          onChange={e => updateRow(r.key, { category: e.target.value, categoryIsNew: !existingCategories.includes(e.target.value.trim()) })}
                          list="add-category-list"
                          placeholder="Category…"
                          className="w-full border border-line-strong rounded-xs px-2 py-1.5 text-sm focus:outline-none focus:border-focus"
                        />
                        {r.categoryIsNew && r.category && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded-xs bg-accent-subtle text-accent text-xs font-medium">New category</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Manual single-add */}
        <div className="bg-surface rounded-lg border border-line shadow-sm p-6">
          <h2 className="text-body font-semibold text-ink mb-1">Add one manually</h2>
          <p className="text-sm text-ink-muted mb-4">Add a single word without the AI. Use ` / ` for multiple valid translations.</p>
          <form onSubmit={addManual} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-sm text-ink-muted mb-1 font-medium">English</label>
              <input
                value={mEnglish}
                onChange={e => setMEnglish(e.target.value)}
                placeholder="dog"
                className="w-full border border-line-strong rounded-sm px-3 py-2 focus:outline-none focus:border-focus text-body"
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-sm text-ink-muted mb-1 font-medium">Finnish</label>
              <input
                value={mFinnish}
                onChange={e => setMFinnish(e.target.value)}
                placeholder="koira"
                className="w-full border border-line-strong rounded-sm px-3 py-2 focus:outline-none focus:border-focus text-body"
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-sm text-ink-muted mb-1 font-medium">Category</label>
              <select
                value={mCatMode === 'new' ? '__new__' : mCategory}
                onChange={e => {
                  if (e.target.value === '__new__') { setMCatMode('new'); setMCategory('') }
                  else { setMCatMode('select'); setMCategory(e.target.value) }
                }}
                className="w-full border border-line-strong rounded-sm px-3 py-2 focus:outline-none focus:border-focus text-body"
              >
                <option value="">Uncategorised</option>
                {knownCategories.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="__new__">+ New category…</option>
              </select>
              {mCatMode === 'new' && (
                <input
                  value={mCategory}
                  onChange={e => setMCategory(e.target.value)}
                  placeholder="New category name"
                  autoFocus
                  className="w-full mt-2 border border-line-strong rounded-sm px-3 py-2 focus:outline-none focus:border-focus text-body"
                />
              )}
            </div>
            <button
              type="submit"
              className="px-5 py-2 bg-accent text-on-accent rounded-sm hover:bg-accent-hover transition-colors whitespace-nowrap"
            >
              Add word
            </button>
          </form>
          {mError && <p className="text-danger text-sm mt-3">{mError}</p>}
          {manualAdded > 0 && (
            <p className="text-success text-sm mt-3">Added {manualAdded} word{manualAdded === 1 ? '' : 's'} this session.</p>
          )}
        </div>
      </div>
    </div>
  )
}
