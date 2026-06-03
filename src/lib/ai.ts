// AI-powered answer checking, called directly from the browser (no backend).
// This is the second phase of marking — Practice runs the local exact-match
// first (src/lib/match.ts) and only falls back here when that fails.
//
// If no API key is set we can't call the model, so the answer is marked wrong
// (only exact matches are accepted) with a hint pointing at Settings.

import Anthropic from '@anthropic-ai/sdk'
import type { Direction } from '../types'
import { getApiKey } from './apiKey'
import { appendTranslation } from './store'

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

export async function checkAnswer(input: {
  prompt: string
  user_answer: string
  reference: string
  direction: Direction
  word_id?: number
}): Promise<{ correct: boolean; feedback: string }> {
  const apiKey = getApiKey()
  if (!apiKey) {
    return {
      correct: false,
      feedback: 'No API key set — only exact matches are accepted. Add a key in Settings to check alternatives.',
    }
  }

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const sourceLang = input.direction === 'en_to_fi' ? 'English' : 'Finnish'
  const targetLang = input.direction === 'en_to_fi' ? 'Finnish' : 'English'

  const response = await client.messages.create({
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
Word/phrase: "${input.prompt}"
Reference answer: "${input.reference}"
Student's answer: "${input.user_answer}"`,
      },
    ],
  })

  const block = response.content[0]
  const raw = block && block.type === 'text' ? block.text : ''
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  const result = JSON.parse(text) as { correct?: boolean; feedback?: string }
  const correct = Boolean(result.correct)

  // Auto-save a newly-confirmed translation so future checks match locally.
  if (correct && input.word_id !== undefined) {
    appendTranslation(input.word_id, input.direction, input.user_answer)
  }

  return { correct, feedback: result.feedback ?? '' }
}
