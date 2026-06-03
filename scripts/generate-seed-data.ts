// Generates src/data/seedWords.ts from initial-translations.md (the single
// source of truth). Only the Kappale 1–6 sections are bundled — these are the
// starter words every new browser receives on first run. Re-run after editing
// the markdown:
//
//   npm run seed:generate
//
// The client store (src/lib/store.ts) imports this generated module to seed
// localStorage on first run.

import { readFileSync, writeFileSync } from 'node:fs'

const SEED_CATEGORY = /^Kappale [1-6]$/

const md = readFileSync('initial-translations.md', 'utf-8')

type SeedWord = { english: string; finnish: string; category: string }
const words: SeedWord[] = []
let category: string | null = null

for (const line of md.split('\n')) {
  const header = line.match(/^##\s+(.+?)\s*$/)
  if (header) {
    category = header[1].trim()
    continue
  }
  if (!category || !SEED_CATEGORY.test(category)) continue

  const match = line.match(/^\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/)
  if (!match) continue
  const [, col1, col2] = match
  if (col1.startsWith('-') || col1 === 'Finnish') continue

  const finnish = col1.trim()
  const english = col2.trim()
  if (!finnish || !english) continue
  words.push({ english, finnish, category })
}

const banner = `// AUTO-GENERATED from initial-translations.md by scripts/generate-seed-data.ts.
// Do not edit by hand — run \`npm run seed:generate\` to regenerate.
// Kappale 1–6 starter words, seeded into localStorage on first run.`

const body = words
  .map((w) => `  { english: ${JSON.stringify(w.english)}, finnish: ${JSON.stringify(w.finnish)}, category: ${JSON.stringify(w.category)} },`)
  .join('\n')

const out = `${banner}

export type SeedWord = { english: string; finnish: string; category: string }

export const SEED_WORDS: SeedWord[] = [
${body}
]
`

writeFileSync('src/data/seedWords.ts', out)
console.log(`Wrote ${words.length} seed words (Kappale 1–6) to src/data/seedWords.ts`)
