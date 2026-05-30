import { readFileSync } from 'fs'
import { db } from './db'

const md = readFileSync('initial-translations.md', 'utf-8')

const check = db.prepare('SELECT id, category FROM words WHERE english = ? AND finnish = ?')
const insert = db.prepare('INSERT INTO words (english, finnish, category) VALUES (?, ?, ?)')
const setCategory = db.prepare('UPDATE words SET category = ? WHERE id = ?')

let inserted = 0
let updated = 0
let skipped = 0

const run = db.transaction(() => {
  // The current "## Section" header is the category for the rows beneath it.
  // The markdown is the source of truth: re-running re-applies categories.
  let category: string | null = null

  for (const line of md.split('\n')) {
    const header = line.match(/^##\s+(.+?)\s*$/)
    if (header) {
      category = header[1].trim()
      continue
    }

    const match = line.match(/^\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/)
    if (!match) continue

    const [, col1, col2] = match
    if (col1.startsWith('-') || col1 === 'Finnish') continue

    const finnish = col1.trim()
    const english = col2.trim()
    if (!finnish || !english) continue

    const existing = check.get(english, finnish) as { id: number; category: string | null } | undefined
    if (existing) {
      // Re-apply the category from the markdown (markdown wins).
      if (existing.category !== category) {
        setCategory.run(category, existing.id)
        updated++
      } else {
        skipped++
      }
    } else {
      insert.run(english, finnish, category)
      inserted++
    }
  }
})

run()
console.log(`Done. ${inserted} inserted, ${updated} re-categorised, ${skipped} unchanged.`)
