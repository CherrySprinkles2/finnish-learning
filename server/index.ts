import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { db } from './db'

const app = express()
app.use(express.json())

app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.path}`, Object.keys(req.body ?? {}).length ? req.body : '')
  next()
})

const anthropic = new Anthropic()

function dbRun(stmt: ReturnType<typeof db.prepare>, ...params: unknown[]) {
  const result = stmt.run(...(params as Parameters<typeof stmt.run>))
  console.log(`[DB] ${(stmt as unknown as { source: string }).source.replace(/\s+/g, ' ').trim()}`, params.length ? params : '', `→ changes: ${result.changes}`)
  return result
}

const CHECK_SYSTEM_PROMPT = `You are checking answers in a Finnish language learning app.
You will be given a word or phrase in one language, a reference translation, and the student's answer.
Judge whether the student's answer is an acceptable translation.

Be lenient with:
- Different but equally valid translations that convey the same meaning
- Minor phrasing variations that preserve the meaning
- Capitalisation differences

Be strict with:
- Wrong vocabulary or meaning
- Answers that are completely unrelated

Respond with raw JSON only — no markdown, no code fences, no explanation: {"correct": true/false, "feedback": "brief reason if wrong, empty string if correct"}`

app.get('/api/words', (_req, res) => {
  const words = db.prepare(`
    SELECT
      w.id, w.english, w.finnish, w.category, w.created_at,
      COUNT(a.id) AS total_attempts,
      SUM(CASE WHEN a.correct = 1 THEN 1 ELSE 0 END) AS correct_count,
      MAX(a.attempted_at) AS last_attempted
    FROM words w
    LEFT JOIN attempts a ON a.word_id = w.id
    GROUP BY w.id
    ORDER BY w.id ASC
  `).all()
  res.json(words)
})

app.post('/api/words', (req, res) => {
  const { english, finnish, category } = req.body as { english: string; finnish: string; category?: string }
  if (!english?.trim() || !finnish?.trim()) {
    res.status(400).json({ error: 'english and finnish are required' })
    return
  }
  const cat = category?.trim() || null
  const result = dbRun(
    db.prepare('INSERT INTO words (english, finnish, category) VALUES (?, ?, ?)'),
    english.trim(), finnish.trim(), cat
  )
  const payload = { id: result.lastInsertRowid, english: english.trim(), finnish: finnish.trim(), category: cat }
  console.log(`[RES] POST /api/words`, payload)
  res.json(payload)
})

app.put('/api/words/:id', (req, res) => {
  const { english, finnish, category } = req.body as { english: string; finnish: string; category?: string }
  if (!english?.trim() || !finnish?.trim()) {
    res.status(400).json({ error: 'english and finnish are required' })
    return
  }
  dbRun(
    db.prepare('UPDATE words SET english = ?, finnish = ?, category = ? WHERE id = ?'),
    english.trim(), finnish.trim(), category?.trim() || null, req.params.id
  )
  console.log(`[RES] PUT /api/words/${req.params.id} ok`)
  res.json({ ok: true })
})

app.delete('/api/words/:id', (req, res) => {
  dbRun(db.prepare('DELETE FROM words WHERE id = ?'), req.params.id)
  console.log(`[RES] DELETE /api/words/${req.params.id} ok`)
  res.json({ ok: true })
})

app.get('/api/categories', (_req, res) => {
  const cats = db.prepare(`
    SELECT category, COUNT(*) AS count
    FROM words
    WHERE category IS NOT NULL AND category != ''
    GROUP BY category
    ORDER BY MIN(id)
  `).all()
  res.json(cats)
})

app.get('/api/practice', (req, res) => {
  const exclude = req.query.exclude ? Number(req.query.exclude) : null
  const category = typeof req.query.category === 'string' && req.query.category ? req.query.category : null
  const mistakesOnly = req.query.mode === 'mistakes'

  const RECENCY_MAX_DAYS = 30
  const RECENCY_MIN = 1
  const RECENCY_MAX = 5
  const ACCURACY_HISTORY = 5
  const ACCURACY_MIN = 1
  const ACCURACY_MAX = 5
  const ACCURACY_UNSEEN = 3

  // "Review mistakes" pool: <50% correct over the last ACCURACY_HISTORY attempts,
  // last tried within MISTAKES_WINDOW_DAYS (mirrors the "struggling" set in /api/stats).
  const MISTAKES_ACCURACY = 0.5
  const MISTAKES_WINDOW_DAYS = 30

  type Row = { id: number; english: string; finnish: string; days_since: number; recent_accuracy: number | null }

  const rows = db.prepare(`
    SELECT
      w.id,
      w.english,
      w.finnish,
      COALESCE(
        CAST(julianday('now') - julianday(MAX(a.attempted_at)) AS INTEGER),
        ${RECENCY_MAX_DAYS}
      ) AS days_since,
      (
        SELECT CAST(SUM(correct) AS REAL) / COUNT(*)
        FROM (SELECT correct FROM attempts WHERE word_id = w.id ORDER BY attempted_at DESC LIMIT ${ACCURACY_HISTORY})
      ) AS recent_accuracy
    FROM words w
    LEFT JOIN attempts a ON a.word_id = w.id
    ${category ? 'WHERE w.category = ?' : ''}
    GROUP BY w.id
  `).all(...(category ? [category] : [])) as Row[]

  // Restrict to recently-struggled words when reviewing mistakes.
  const pool = mistakesOnly
    ? rows.filter(r => r.recent_accuracy !== null && r.recent_accuracy < MISTAKES_ACCURACY && r.days_since <= MISTAKES_WINDOW_DAYS)
    : rows

  if (pool.length === 0) { res.json(null); return }
  // Exclude the previous word, but don't dead-end a small pool.
  let candidates = exclude ? pool.filter(r => r.id !== exclude) : pool
  if (candidates.length === 0) candidates = pool

  const weighted = candidates.map(r => {
    const recency = (Math.min(r.days_since, RECENCY_MAX_DAYS) / RECENCY_MAX_DAYS) * (RECENCY_MAX - RECENCY_MIN) + RECENCY_MIN
    const accuracy = r.recent_accuracy === null
      ? ACCURACY_UNSEEN
      : (1 - r.recent_accuracy) * (ACCURACY_MAX - ACCURACY_MIN) + ACCURACY_MIN
    return { ...r, weight: recency * accuracy }
  })

  const total = weighted.reduce((sum, w) => sum + w.weight, 0)
  let rand = Math.random() * total
  let selected = weighted[weighted.length - 1]
  for (const w of weighted) {
    rand -= w.weight
    if (rand <= 0) { selected = w; break }
  }

  const direction = Math.random() < 0.5 ? 'en_to_fi' : 'fi_to_en'
  res.json({ id: selected.id, english: selected.english, finnish: selected.finnish, direction })
})

app.get('/api/stats', (_req, res) => {
  const daily = db.prepare(`
    SELECT date(attempted_at) as day, COUNT(*) as attempts, SUM(correct) as correct
    FROM attempts
    WHERE attempted_at >= date('now', '-90 days')
    GROUP BY day
    ORDER BY day
  `).all()

  // First day each word crossed ≥80% accuracy with ≥3 cumulative attempts
  const masteredByDay = db.prepare(`
    WITH daily_agg AS (
      SELECT word_id, date(attempted_at) as day, SUM(correct) as correct, COUNT(*) as total
      FROM attempts
      GROUP BY word_id, date(attempted_at)
    ),
    cumulative AS (
      SELECT word_id, day,
        SUM(correct) OVER (PARTITION BY word_id ORDER BY day) as cum_correct,
        SUM(total)   OVER (PARTITION BY word_id ORDER BY day) as cum_total
      FROM daily_agg
    ),
    first_mastered AS (
      SELECT word_id, MIN(day) as mastered_on
      FROM cumulative
      WHERE cum_total >= 2 AND CAST(cum_correct AS REAL) / cum_total >= 0.8
      GROUP BY word_id
    )
    SELECT mastered_on as day, COUNT(*) as newly_mastered
    FROM first_mastered
    GROUP BY mastered_on
    ORDER BY mastered_on
  `).all()

  // Words with <50% accuracy in their last 5 attempts, tried within 14 days
  const struggling = db.prepare(`
    WITH recent AS (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY word_id ORDER BY attempted_at DESC) as rn
      FROM attempts
    )
    SELECT
      w.id, w.english, w.finnish,
      COUNT(*) as recent_attempts,
      SUM(r.correct) as recent_correct,
      MAX(r.attempted_at) as last_attempted
    FROM words w
    JOIN recent r ON r.word_id = w.id AND r.rn <= 5
    GROUP BY w.id
    HAVING recent_attempts >= 1
      AND CAST(recent_correct AS REAL) / recent_attempts < 0.5
      AND MAX(r.attempted_at) >= datetime('now', '-30 days')
    ORDER BY CAST(recent_correct AS REAL) / recent_attempts ASC
    LIMIT 20
  `).all()

  res.json({ daily, masteredByDay, struggling })
})

app.post('/api/attempts', (req, res) => {
  const { word_id, direction, correct } = req.body as {
    word_id: number
    direction: 'en_to_fi' | 'fi_to_en'
    correct: boolean
  }
  dbRun(
    db.prepare('INSERT INTO attempts (word_id, direction, correct) VALUES (?, ?, ?)'),
    word_id, direction, correct ? 1 : 0
  )
  res.json({ ok: true })
})

app.post('/api/check', async (req, res) => {
  const { prompt, user_answer, reference, direction, word_id } = req.body as {
    prompt: string
    user_answer: string
    reference: string
    direction: 'en_to_fi' | 'fi_to_en'
    word_id?: number
  }

  const sourceLang = direction === 'en_to_fi' ? 'English' : 'Finnish'
  const targetLang = direction === 'en_to_fi' ? 'Finnish' : 'English'

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 150,
      system: [
        {
          type: 'text',
          text: CHECK_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Translating from ${sourceLang} to ${targetLang}.
Word/phrase: "${prompt}"
Reference answer: "${reference}"
Student's answer: "${user_answer}"`,
        },
      ],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''
    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const result = JSON.parse(text)
    const correct = Boolean(result.correct)

    if (correct && word_id) {
      const field = direction === 'en_to_fi' ? 'finnish' : 'english'
      const row = db.prepare(`SELECT ${field} FROM words WHERE id = ?`).get(word_id) as Record<string, string> | undefined
      if (row) {
        const existing = row[field].split('/').map((s: string) => s.trim().toLowerCase())
        const normalized = user_answer.trim().toLowerCase()
        if (!existing.includes(normalized)) {
          const updated = row[field] + ' / ' + user_answer.trim()
          dbRun(db.prepare(`UPDATE words SET ${field} = ? WHERE id = ?`), updated, word_id)
          console.log(`[AUTO-SAVE] word ${word_id} ${field}: added "${user_answer.trim()}"`)
        }
      }
    }

    console.log(`[RES] POST /api/check correct=${correct} feedback="${result.feedback ?? ''}"`)
    res.json({ correct, feedback: result.feedback ?? '' })
  } catch (err) {
    console.error('[ERR] Check error:', err)
    res.status(500).json({ error: 'Failed to check answer' })
  }
})

app.listen(3001, () => console.log('API server on http://localhost:3001'))
