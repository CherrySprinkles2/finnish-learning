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
