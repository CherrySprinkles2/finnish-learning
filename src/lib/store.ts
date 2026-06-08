// Client-side data store — the single source of truth for vocabulary and
// attempt history, replacing the old Express/D1 backend. Everything lives in
// localStorage; reads are synchronous off an in-memory copy, writes persist
// immediately.
//
// The query logic here (weighted practice selection, progress stats) is a
// faithful port of the SQL that used to live in server/index.ts — same
// constants, same windows — so behaviour is unchanged.

import type { Word, PracticeWord, Direction, StoredWord, Attempt, AppData } from '../types'
import SEED_WORDS from '../data/seedWords.json'

const DATA_KEY = 'finnish:data'
const DATA_VERSION = 1

// Backup-reminder bookkeeping (see shouldRemindBackup / getBackupInfo).
const LAST_MODIFIED_KEY = 'finnish:lastModified'
const LAST_BACKUP_KEY = 'finnish:lastBackup'
const BACKUP_REMINDER_DAYS = 7

// Display key for a word's category — null/blank collapses to 'Uncategorised',
// matching the grouping in Words.tsx. The disabled-categories set is keyed by
// this, so toggling the Uncategorised card works too.
const UNCATEGORISED = 'Uncategorised'
function categoryKey(category: string | null): string {
  return category?.trim() || UNCATEGORISED
}

// ---------------------------------------------------------------------------
// Timestamps
// ---------------------------------------------------------------------------
// The old SQLite backend stored `YYYY-MM-DD HH:MM:SS` in UTC (via
// datetime('now')). We keep that exact format so existing exported data and
// the Progress page's `new Date(ts + 'Z')` parsing keep working.

function now(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19)
}

function parseTs(ts: string): number {
  return new Date(ts.replace(' ', 'T') + 'Z').getTime()
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

function seedData(): AppData {
  const created = now()
  const words: StoredWord[] = SEED_WORDS.map((w, i) => ({
    id: i + 1,
    english: w.english,
    finnish: w.finnish,
    category: w.category,
    created_at: created,
  }))
  return {
    version: DATA_VERSION,
    words,
    attempts: [],
    nextWordId: words.length + 1,
    nextAttemptId: 1,
    disabledCategories: [],
  }
}

function load(): AppData {
  const raw = localStorage.getItem(DATA_KEY)
  // First run (key absent) → seed the starter words. A deliberate clear to an
  // empty list keeps the key present, so we never silently re-seed.
  if (raw === null) {
    const seeded = seedData()
    localStorage.setItem(DATA_KEY, JSON.stringify(seeded))
    return seeded
  }
  try {
    const parsed = JSON.parse(raw) as AppData
    return normalize(parsed)
  } catch {
    const seeded = seedData()
    localStorage.setItem(DATA_KEY, JSON.stringify(seeded))
    return seeded
  }
}

// Defensive: tolerate older/partial blobs and recompute id counters.
function normalize(d: Partial<AppData>): AppData {
  const words = d.words ?? []
  const attempts = d.attempts ?? []
  return {
    version: d.version ?? DATA_VERSION,
    words,
    attempts,
    nextWordId: d.nextWordId ?? maxId(words) + 1,
    nextAttemptId: d.nextAttemptId ?? maxId(attempts) + 1,
    disabledCategories: d.disabledCategories ?? [],
  }
}

function maxId(rows: { id: number }[]): number {
  return rows.reduce((m, r) => Math.max(m, r.id), 0)
}

let data: AppData = load()

function persist(): void {
  localStorage.setItem(DATA_KEY, JSON.stringify(data))
  localStorage.setItem(LAST_MODIFIED_KEY, String(Date.now()))
}

// ---------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------

export function getWords(): Word[] {
  // Join attempt stats per word (old GET /api/words).
  const byWord = new Map<number, Attempt[]>()
  for (const a of data.attempts) {
    const list = byWord.get(a.word_id)
    if (list) list.push(a)
    else byWord.set(a.word_id, [a])
  }

  return data.words
    .slice()
    .sort((a, b) => a.id - b.id)
    .map((w) => {
      const atts = byWord.get(w.id) ?? []
      const last = atts.reduce<string | null>(
        (m, a) => (m === null || a.attempted_at > m ? a.attempted_at : m),
        null,
      )
      return {
        id: w.id,
        english: w.english,
        finnish: w.finnish,
        category: w.category,
        created_at: w.created_at,
        total_attempts: atts.length,
        correct_count: atts.reduce((s, a) => s + (a.correct ? 1 : 0), 0),
        last_attempted: last,
      }
    })
}

export function addWord(input: { english: string; finnish: string; category?: string | null }): StoredWord {
  const word: StoredWord = {
    id: data.nextWordId++,
    english: input.english.trim(),
    finnish: input.finnish.trim(),
    category: input.category?.trim() || null,
    created_at: now(),
  }
  data.words.push(word)
  persist()
  return word
}

// Add several words in one write (the Add Vocabulary bulk save).
export function addWords(
  inputs: { english: string; finnish: string; category?: string | null }[],
): void {
  if (inputs.length === 0) return
  const created = now()
  for (const input of inputs) {
    if (!input.english.trim() || !input.finnish.trim()) continue
    data.words.push({
      id: data.nextWordId++,
      english: input.english.trim(),
      finnish: input.finnish.trim(),
      category: input.category?.trim() || null,
      created_at: created,
    })
  }
  persist()
}

export function updateWord(
  id: number,
  input: { english: string; finnish: string; category?: string | null },
): void {
  const word = data.words.find((w) => w.id === id)
  if (!word) return
  word.english = input.english.trim()
  word.finnish = input.finnish.trim()
  word.category = input.category?.trim() || null
  persist()
}

export function deleteWord(id: number): void {
  data.words = data.words.filter((w) => w.id !== id)
  data.attempts = data.attempts.filter((a) => a.word_id !== id) // cascade
  persist()
}

export function getCategories(
  opts: { includeDisabled?: boolean } = {},
): { category: string; count: number }[] {
  // Distinct non-empty categories, ordered by first appearance (min word id).
  const { includeDisabled = true } = opts
  const disabled = new Set(data.disabledCategories)
  const order: string[] = []
  const counts = new Map<string, number>()
  for (const w of data.words.slice().sort((a, b) => a.id - b.id)) {
    if (!w.category) continue
    if (!includeDisabled && disabled.has(w.category)) continue
    if (!counts.has(w.category)) order.push(w.category)
    counts.set(w.category, (counts.get(w.category) ?? 0) + 1)
  }
  return order.map((category) => ({ category, count: counts.get(category)! }))
}

// ---------------------------------------------------------------------------
// Disabled categories — hide a category from Practice + Progress (view-only;
// the words stay in the store and remain available in the Vocabulary list and
// Study modes). Keyed by category display key (see categoryKey).
// ---------------------------------------------------------------------------

export function getDisabledCategories(): string[] {
  return data.disabledCategories.slice()
}

export function isCategoryDisabled(category: string): boolean {
  return data.disabledCategories.includes(category)
}

export function setCategoryDisabled(category: string, disabled: boolean): void {
  const has = data.disabledCategories.includes(category)
  if (disabled === has) return
  data.disabledCategories = disabled
    ? [...data.disabledCategories, category]
    : data.disabledCategories.filter((c) => c !== category)
  persist()
}

// ---------------------------------------------------------------------------
// Attempts
// ---------------------------------------------------------------------------

export function recordAttempt(input: { word_id: number; direction: Direction; correct: boolean }): void {
  data.attempts.push({
    id: data.nextAttemptId++,
    word_id: input.word_id,
    direction: input.direction,
    correct: input.correct,
    attempted_at: now(),
  })
  persist()
}

// Append a newly-confirmed translation to a word's field (the /api/check
// auto-save). Returns true if it actually added something.
export function appendTranslation(id: number, direction: Direction, answer: string): boolean {
  const word = data.words.find((w) => w.id === id)
  if (!word) return false
  const field = direction === 'en_to_fi' ? 'finnish' : 'english'
  const existing = word[field].split('/').map((s) => s.trim().toLowerCase())
  const normalized = answer.trim().toLowerCase()
  if (existing.includes(normalized)) return false
  word[field] = word[field] + ' / ' + answer.trim()
  persist()
  return true
}

// ---------------------------------------------------------------------------
// Practice — weighted random selection (port of GET /api/practice)
// ---------------------------------------------------------------------------

const RECENCY_MAX_DAYS = 30
const RECENCY_MIN = 1
const RECENCY_MAX = 5
const ACCURACY_HISTORY = 5
const ACCURACY_MIN = 1
const ACCURACY_MAX = 5
const ACCURACY_UNSEEN = 3
const MISTAKES_ACCURACY = 0.5
const MISTAKES_WINDOW_DAYS = 30

// The last ACCURACY_HISTORY attempts for a word, most-recent first.
function recentAttempts(wordId: number): Attempt[] {
  return data.attempts
    .filter((a) => a.word_id === wordId)
    .sort((a, b) => parseTs(b.attempted_at) - parseTs(a.attempted_at))
    .slice(0, ACCURACY_HISTORY)
}

export function getPractice(opts: {
  exclude?: number | null
  category?: string | null
  mode?: 'all' | 'mistakes'
} = {}): PracticeWord | null {
  const { exclude = null, category = null, mode = 'all' } = opts
  const nowMs = Date.now()

  // When no category is pinned, skip words in disabled categories. An explicit
  // category (e.g. Study → Typed recall) overrides, so hidden decks still work.
  const disabled = new Set(data.disabledCategories)
  const rows = data.words
    .filter((w) => (category ? w.category === category : !disabled.has(categoryKey(w.category))))
    .map((w) => {
      const recent = recentAttempts(w.id)
      const days_since = recent.length
        ? Math.trunc((nowMs - parseTs(recent[0].attempted_at)) / 86_400_000)
        : RECENCY_MAX_DAYS
      const recent_accuracy = recent.length
        ? recent.reduce((s, a) => s + (a.correct ? 1 : 0), 0) / recent.length
        : null
      return { id: w.id, english: w.english, finnish: w.finnish, days_since, recent_accuracy }
    })

  const pool =
    mode === 'mistakes'
      ? rows.filter(
          (r) =>
            r.recent_accuracy !== null &&
            r.recent_accuracy < MISTAKES_ACCURACY &&
            r.days_since <= MISTAKES_WINDOW_DAYS,
        )
      : rows

  if (pool.length === 0) return null

  let candidates = exclude !== null ? pool.filter((r) => r.id !== exclude) : pool
  if (candidates.length === 0) candidates = pool

  const weighted = candidates.map((r) => {
    const recency =
      (Math.min(r.days_since, RECENCY_MAX_DAYS) / RECENCY_MAX_DAYS) * (RECENCY_MAX - RECENCY_MIN) + RECENCY_MIN
    const accuracy =
      r.recent_accuracy === null
        ? ACCURACY_UNSEEN
        : (1 - r.recent_accuracy) * (ACCURACY_MAX - ACCURACY_MIN) + ACCURACY_MIN
    return { ...r, weight: recency * accuracy }
  })

  const total = weighted.reduce((s, w) => s + w.weight, 0)
  let rand = Math.random() * total
  let selected = weighted[weighted.length - 1]
  for (const w of weighted) {
    rand -= w.weight
    if (rand <= 0) {
      selected = w
      break
    }
  }

  const direction: Direction = Math.random() < 0.5 ? 'en_to_fi' : 'fi_to_en'
  return { id: selected.id, english: selected.english, finnish: selected.finnish, direction }
}

// ---------------------------------------------------------------------------
// Stats (port of GET /api/stats)
// ---------------------------------------------------------------------------

export interface DailyPoint { day: string; attempts: number; correct: number }
export interface StrugglingWord {
  id: number; english: string; finnish: string
  recent_attempts: number; recent_correct: number; last_attempted: string
}
export interface KnownWellWord {
  id: number; english: string; finnish: string; category: string | null
  recent_attempts: number; recent_correct: number; last_attempted: string
}
export interface CategoryAccuracy {
  category: string; word_count: number; total_attempts: number; correct_attempts: number
}
export interface Stats {
  daily: DailyPoint[]
  struggling: StrugglingWord[]
  knownWell: KnownWellWord[]
  categoryAccuracy: CategoryAccuracy[]
}

function daysAgoTs(days: number): number {
  return Date.now() - days * 86_400_000
}

// Per-word summary over the last ACCURACY_HISTORY attempts, for the three
// "recent" CTEs in the old stats query.
interface RecentSummary {
  word: StoredWord
  recent_attempts: number
  recent_correct: number
  last_attempted: string
  lastMs: number
}

function recentSummaries(): RecentSummary[] {
  const wordById = new Map(data.words.map((w) => [w.id, w]))
  const summaries: RecentSummary[] = []
  for (const w of data.words) {
    const recent = recentAttempts(w.id)
    if (recent.length === 0) continue
    summaries.push({
      word: wordById.get(w.id)!,
      recent_attempts: recent.length,
      recent_correct: recent.reduce((s, a) => s + (a.correct ? 1 : 0), 0),
      last_attempted: recent[0].attempted_at,
      lastMs: parseTs(recent[0].attempted_at),
    })
  }
  return summaries
}

export function getStats(): Stats {
  // Hidden categories are excluded everywhere on the Progress dashboard.
  const disabled = new Set(data.disabledCategories)
  const isHidden = (w: StoredWord) => disabled.has(categoryKey(w.category))
  const hiddenWordIds = new Set(data.words.filter(isHidden).map((w) => w.id))

  // Daily rollup over the last 90 days.
  const cutoff90 = daysAgoTs(90)
  const dailyMap = new Map<string, DailyPoint>()
  for (const a of data.attempts) {
    if (parseTs(a.attempted_at) < cutoff90) continue
    if (hiddenWordIds.has(a.word_id)) continue
    const day = a.attempted_at.slice(0, 10)
    const point = dailyMap.get(day) ?? { day, attempts: 0, correct: 0 }
    point.attempts++
    if (a.correct) point.correct++
    dailyMap.set(day, point)
  }
  const daily = [...dailyMap.values()].sort((a, b) => a.day.localeCompare(b.day))

  const summaries = recentSummaries().filter((s) => !isHidden(s.word))
  const cutoff30 = daysAgoTs(30)
  const cutoff60 = daysAgoTs(60)

  const struggling: StrugglingWord[] = summaries
    .filter((s) => s.recent_correct / s.recent_attempts < 0.5 && s.lastMs >= cutoff30)
    .sort((a, b) => a.recent_correct / a.recent_attempts - b.recent_correct / b.recent_attempts)
    .slice(0, 20)
    .map((s) => ({
      id: s.word.id, english: s.word.english, finnish: s.word.finnish,
      recent_attempts: s.recent_attempts, recent_correct: s.recent_correct,
      last_attempted: s.last_attempted,
    }))

  const knownWell: KnownWellWord[] = summaries
    .filter((s) => s.recent_attempts >= 3 && s.recent_correct / s.recent_attempts >= 0.8 && s.lastMs >= cutoff60)
    .sort((a, b) => {
      const accDiff = b.recent_correct / b.recent_attempts - a.recent_correct / a.recent_attempts
      return accDiff !== 0 ? accDiff : b.lastMs - a.lastMs
    })
    .map((s) => ({
      id: s.word.id, english: s.word.english, finnish: s.word.finnish, category: s.word.category,
      recent_attempts: s.recent_attempts, recent_correct: s.recent_correct,
      last_attempted: s.last_attempted,
    }))

  // Per-category accuracy over the recent sets (weakest first).
  const catMap = new Map<string, CategoryAccuracy>()
  for (const s of summaries) {
    const category = s.word.category || 'Uncategorised'
    const c = catMap.get(category) ?? { category, word_count: 0, total_attempts: 0, correct_attempts: 0 }
    c.word_count++
    c.total_attempts += s.recent_attempts
    c.correct_attempts += s.recent_correct
    catMap.set(category, c)
  }
  const categoryAccuracy = [...catMap.values()].sort(
    (a, b) => a.correct_attempts / a.total_attempts - b.correct_attempts / b.total_attempts,
  )

  return { daily, struggling, knownWell, categoryAccuracy }
}

// ---------------------------------------------------------------------------
// Export / import (Settings page)
// ---------------------------------------------------------------------------

export function exportData(): AppData {
  return data
}

// Byte size of the app's own stored data (the finnish:data blob), in UTF-8 bytes.
// This is the honest "how big is my vocabulary" number — unlike navigator.storage
// .estimate(), which reports the whole origin (caches, dev assets) and is padded.
export function dataSize(): number {
  const raw = localStorage.getItem(DATA_KEY) ?? ''
  return new TextEncoder().encode(raw).length
}

// Replace all data with an imported payload. Recomputes id counters defensively.
export function importData(payload: { words?: unknown; attempts?: unknown; disabledCategories?: unknown }): void {
  const words = (payload.words ?? []) as StoredWord[]
  const attempts = (payload.attempts ?? []) as Attempt[]
  const disabledCategories = Array.isArray(payload.disabledCategories)
    ? (payload.disabledCategories as string[]).filter((c) => typeof c === 'string')
    : []
  data = {
    version: DATA_VERSION,
    words,
    attempts,
    nextWordId: maxId(words) + 1,
    nextAttemptId: maxId(attempts) + 1,
    disabledCategories,
  }
  persist()
  // The imported file IS a backup, so the restored state is already "saved".
  markBackedUp()
}

// Validate an arbitrary parsed object looks like our export format.
export function isValidImport(obj: unknown): obj is AppData {
  if (typeof obj !== 'object' || obj === null) return false
  const o = obj as Record<string, unknown>
  if (!Array.isArray(o.words) || !Array.isArray(o.attempts)) return false
  const wordOk = o.words.every(
    (w) => w && typeof w === 'object' && 'id' in w && 'english' in w && 'finnish' in w,
  )
  const attemptOk = o.attempts.every(
    (a) => a && typeof a === 'object' && 'word_id' in a && 'direction' in a && 'correct' in a,
  )
  return wordOk && attemptOk
}

// ---------------------------------------------------------------------------
// Backup reminders
// ---------------------------------------------------------------------------

function readTimestamp(key: string): number | null {
  const raw = localStorage.getItem(key)
  if (raw === null) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

// Call when the user has just taken a durable backup (export/import).
export function markBackedUp(): void {
  localStorage.setItem(LAST_BACKUP_KEY, String(Date.now()))
}

export interface BackupInfo {
  lastBackup: number | null
  lastModified: number | null
  hasUnsavedChanges: boolean
}

export function getBackupInfo(): BackupInfo {
  const lastBackup = readTimestamp(LAST_BACKUP_KEY)
  const lastModified = readTimestamp(LAST_MODIFIED_KEY)
  return {
    lastBackup,
    lastModified,
    hasUnsavedChanges: lastModified !== null && (lastBackup === null || lastModified > lastBackup),
  }
}

// Whether to surface the backup-reminder banner. Deliberately conservative so it
// nudges rather than nags: only once there's real history to lose, and either
// never backed up or the last backup is stale and out of date.
export function shouldRemindBackup(): boolean {
  if (data.attempts.length === 0) return false
  const { lastBackup, lastModified, hasUnsavedChanges } = getBackupInfo()
  if (!hasUnsavedChanges || lastModified === null) return false
  if (lastBackup === null) return true
  return Date.now() - lastBackup >= BACKUP_REMINDER_DAYS * 86_400_000
}
