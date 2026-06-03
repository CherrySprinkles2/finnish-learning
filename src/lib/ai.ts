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

// ---------------------------------------------------------------------------
// Bulk vocabulary generation (Add Vocabulary page)
// ---------------------------------------------------------------------------
// Given a list of English words, ask Claude for Finnish translations + a
// category for each, reusing the learner's existing categories where possible.
// Uses Sonnet for translation quality and structured tool output for a reliable
// shape. Results are reviewed/edited by the user before anything is saved.

const GENERATE_MODEL = 'claude-sonnet-4-6'
export const MAX_GENERATE_ITEMS = 100

export interface GeneratedWord {
  english: string
  finnish: string
  category: string
  categoryIsNew: boolean
}

const GENERATE_SYSTEM_PROMPT = `You are a vocabulary assistant for a Finnish language-learning app. Given a list of English words or phrases, produce a Finnish translation for each, ready to add to the learner's vocabulary.

Rules for each entry:
- Give the Finnish in its nominative (dictionary) base form — e.g. "koira" not "koiraa", "espanja" not "espanjaa". Do not inflect.
- If there are several genuinely common, equally valid Finnish translations, include them separated by " / " (e.g. "iso / suuri"). Two or three at most — do not pad with rare or obscure synonyms.
- Keep the English as given, lightly normalised (trimmed; lowercased unless a proper noun).
- Assign a category. You will be given the learner's existing categories — REUSE an existing category whenever one reasonably fits. Only invent a new category when none fits, keeping new names concise and consistent in style and language with the existing ones. Set categoryIsNew to true only for categories that are not in the provided list.
- Return one entry per input item, in the same order. Skip anything that is not a translatable word or phrase.

Return your result by calling the save_translations tool.`

export async function generateVocabulary(
  englishList: string[],
  existingCategories: string[],
): Promise<GeneratedWord[]> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('No API key set. Add your Anthropic key in Settings to generate translations.')
  }

  const items = englishList.map((s) => s.trim()).filter(Boolean).slice(0, MAX_GENERATE_ITEMS)
  if (items.length === 0) return []

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const tools: Anthropic.Tool[] = [
    {
      name: 'save_translations',
      description: 'Save the generated Finnish translations for the learner to review.',
      input_schema: {
        type: 'object',
        properties: {
          words: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                english: { type: 'string', description: 'The English word or phrase.' },
                finnish: {
                  type: 'string',
                  description: 'Finnish translation in nominative base form; multiple valid translations separated by " / ".',
                },
                category: { type: 'string', description: 'Category name, reusing an existing one where possible.' },
                categoryIsNew: {
                  type: 'boolean',
                  description: 'True only if this category is not in the provided existing categories.',
                },
              },
              required: ['english', 'finnish', 'category', 'categoryIsNew'],
            },
          },
        },
        required: ['words'],
      },
    },
  ]

  const response = await client.messages.create({
    model: GENERATE_MODEL,
    max_tokens: Math.min(8192, 400 + items.length * 80),
    system: [{ type: 'text', text: GENERATE_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    tools,
    tool_choice: { type: 'tool', name: 'save_translations' },
    messages: [
      {
        role: 'user',
        content: `Existing categories: ${existingCategories.length ? existingCategories.join(', ') : '(none yet)'}

English words to translate (one per line):
${items.join('\n')}`,
      },
    ],
  })

  const toolUse = response.content.find((b) => b.type === 'tool_use') as Anthropic.ToolUseBlock | undefined
  if (!toolUse) throw new Error('The model did not return any translations. Please try again.')

  const result = toolUse.input as { words?: GeneratedWord[] }
  return (result.words ?? [])
    .filter((w) => w && typeof w.english === 'string' && typeof w.finnish === 'string' && w.english.trim() && w.finnish.trim())
    .map((w) => ({
      english: w.english.trim(),
      finnish: w.finnish.trim(),
      category: (w.category ?? '').trim(),
      categoryIsNew: Boolean(w.categoryIsNew),
    }))
}
