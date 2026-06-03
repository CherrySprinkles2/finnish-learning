export interface Word {
  id: number
  english: string
  finnish: string
  category: string | null
  created_at: string
  total_attempts: number
  correct_count: number
  last_attempted: string | null
}

export type Direction = 'en_to_fi' | 'fi_to_en'

export interface PracticeWord {
  id: number
  english: string
  finnish: string
  direction: Direction
}

// Plain word record as persisted (no derived stats).
export interface StoredWord {
  id: number
  english: string
  finnish: string
  category: string | null
  created_at: string
}

export interface Attempt {
  id: number
  word_id: number
  direction: Direction
  correct: boolean
  attempted_at: string
}

// Shape of the localStorage blob and of the export/import JSON file.
export interface AppData {
  version: number
  words: StoredWord[]
  attempts: Attempt[]
  nextWordId: number
  nextAttemptId: number
  // Category names hidden from Practice + Progress (by display key, where
  // Uncategorised words use the literal 'Uncategorised'). View-only filter —
  // the words themselves are untouched. Travels with export/import.
  disabledCategories: string[]
}
