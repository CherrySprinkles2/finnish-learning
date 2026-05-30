# Grammar Page Plan

A grammar guide aligned with **Suomen mestari 1**, covering the topics introduced in Kappale 1–9. Since the vocabulary database currently contains Kappale 1–5, those chapters are the first priority. Chapters 6–9 can be added incrementally.

---

## Goal

The page serves **three reading modes at once**, layered within each grammar topic so the user picks the depth they need:

1. **Quick reference** — terse paradigm tables and rule boxes, scannable in 10 seconds. "How does partitive work again?" answered mid-practice without breaking flow.
2. **Detailed guide** — plain-English prose explaining *why* and *when* a structure is used, not just *what* the endings are. Read once to actually learn the topic.
3. **Self-test** — short, varied exercises per topic so the user can check they've understood, with answers revealed on demand.

Everything is **100% client-side**: content is hardcoded in a static data file, exercises are checked with local string comparison, and there is no back-end, no API call, and no server round-trip. The page loads instantly and works offline.

The three modes coexist in one scrollable topic: a prose explanation opens the topic (the *guide*), tables and rule boxes follow (the *quick reference*), and exercises close it (the *self-test*). A user skimming for a reminder reads only the tables; a user learning the topic reads top to bottom and does the drills.

---

## Content scope — Suomen mestari 1

### Priority 1 (Kappale 1–5, already in vocabulary)

| Kappale | Grammar topics |
|---------|---------------|
| 1 | Personal pronouns (minä, sinä, hän…), `olla` conjugation, vowel harmony (a/ä) |
| 2 | Verb type 1 conjugation, negative verb (`ei`), K-P-T consonant gradation (intro), question words (kuka, mitä, missä…), yes/no questions with `-ko/-kö` |
| 3 | Genitive case (`-n`), K-P-T gradation in verb type 1 |
| 4 | Possession structure `minulla on`, partitive case (intro), partitive verbs (rakastaa, tarvita…) |
| 5 | Verb types 1–5 (stems and endings summary) |

### Priority 2 (Kappale 6–9, future vocabulary)

| Kappale | Grammar topics |
|---------|---------------|
| 6 | Locative/location cases (inessive -ssa/-ssä, elative -sta/-stä, illative), nominative plural, existential sentences, demonstrative pronouns (tämä/tuo/se), imperative (sinä-form) |
| 7 | Noun word types, K-P-T in nouns, demonstrative pronoun inflection |
| 8 | Partitive of ingredients (without), plural partitive, postpositions (alla, päällä, vieressä…), ordinal numbers |
| 9 | Object cases (nominative/genitive/partitive object), kenelle/keneltä (allative/ablative), full personal pronoun inflection, subordinate clauses with `että` |

---

## UI approach

### Layout

A single scrollable page divided into collapsible sections, one per chapter. Each section has a chapter header (`Kappale 1 — Pronouns & olla`) that can be expanded/collapsed. On first load, Kappale 1 is open and the rest are collapsed.

Within a chapter, each **topic** renders its blocks top to bottom in this natural order: prose explanation → tables / rule boxes / gradation → exercises. The data file controls the exact order per topic, but this is the default shape.

### Content blocks within each topic

Each grammar topic uses one or more of these block types:

**Prose** — plain-English explanation of the topic: what it is, *when* you use it, and the gotchas. This is the "detailed guide" layer. It holds **arbitrary-length markdown** — multiple paragraphs, inline **bold**, inline `examples`, and bullet lists — so a simple topic gets two sentences and a hard topic (partitive, gradation) gets several paragraphs. A topic can have **multiple prose blocks** interleaved with tables, e.g. explain the rule, show a table, then explain the exceptions below it.

**Table** — for paradigms (pronoun declension, verb conjugation, case endings). Clean two- or three-column layout, with the Finnish form bold and the English gloss in regular weight.

**Example sentence** — a Finnish sentence with word-by-word gloss below it, e.g.:
```
Minulla  on   koira.
I-at     is   dog.
"I have a dog."
```

**Rule box** — a highlighted callout for concise rules, e.g. "Add -ko/-kö to the verb to make a yes/no question. Use -ko after back vowels (a, o, u), -kö after front vowels (ä, ö, y)."

**Gradation table** — for K-P-T: a three-column table showing strong grade → weak grade → example word.

**Exercise** — the "self-test" layer. A small set of interactive drills for the topic, checked entirely client-side (see below). Each topic can include **several exercises of different types** so the user tests the topic from multiple angles.

### Exercise types (all client-side)

Every exercise reveals the correct answer on demand and, where the user types an answer, checks it locally with **normalized comparison** (trim, lowercase, strip parentheticals, split valid alternatives on `/`) — the same matching idea already used in Practice's local-match phase, but with **no AI fallback**. The result is a simple ✓ / ✗ plus the expected answer.

- **Fill-in-the-blank / transformation** — "Put *koira* into the partitive: `____`" → user types `koiraa`, checked locally.
- **Conjugation drill** — show a verb infinitive and ask for one or all six personal forms; reveal the full paradigm.
- **Multiple-choice** — "Which is correct: *minä olen* / *minä on* / *minä ole*?" Click to select; correct option highlights.
- **Translate** — a short EN↔FI sentence with a reveal-answer toggle. Because full sentences have many valid phrasings, this type defaults to **reveal-only** (no auto-marking) to avoid false negatives, unless an explicit alternatives list is supplied.
- **Identify-the-case / spot-the-form** — show a sentence and ask which case is used or which word is in partitive; multiple-choice under the hood.

Exercises track only transient UI state (revealed?, selected option, typed value) via `useState`. Nothing is persisted unless we later add the optional "understood" tracking below.

### Navigation

A sticky mini-nav or a table-of-contents sidebar listing each chapter heading so the user can jump directly to a section. On mobile, the TOC collapses into a dropdown.

---

## Data model

Grammar content is **static** — stored in `src/data/grammar.ts` as a typed array of chapter objects. No database or API needed.

```ts
// src/data/grammar.ts

export type BlockType =
  | 'prose'
  | 'table'
  | 'example'
  | 'rule'
  | 'gradation'
  | 'exercise'

export type ExerciseType =
  | 'fill-blank'
  | 'conjugation'
  | 'multiple-choice'
  | 'translate'
  | 'identify'

// One drill within an exercise block.
export interface ExerciseItem {
  type: ExerciseType
  prompt: string            // the question shown to the user
  answer?: string           // expected answer; supports `/`-separated alternatives
  options?: string[]        // for multiple-choice / identify
  correctOption?: number    // index into options
  revealOnly?: boolean      // skip auto-marking, just reveal (default for translate)
  note?: string             // optional explanation shown after reveal
}

export interface ExerciseContent {
  items: ExerciseItem[]
}

export interface GrammarBlock {
  type: BlockType
  title?: string
  // prose/rule -> markdown string; table -> TableContent;
  // example -> ExampleContent; exercise -> ExerciseContent
  content: string | TableContent | ExampleContent | ExerciseContent
}

export interface GrammarSection {
  topic: string          // e.g. "Verb type 1 conjugation"
  blocks: GrammarBlock[] // prose → tables → exercises, in render order
}

export interface GrammarChapter {
  number: number
  title: string          // e.g. "Minkämaalainen sinä olet?"
  sections: GrammarSection[]
}

export const grammarChapters: GrammarChapter[] = [ /* ... */ ]
```

The `Grammar.tsx` page imports this array and renders it. No server round-trips, instant load. `prose` and `rule` content is markdown, rendered with a tiny markdown renderer (or a minimal bold/italic/list parser if we want to avoid a dependency).

---

## Component structure

```
src/
  data/
    grammar.ts            # All content as typed data
  components/
    grammar/
      ChapterSection.tsx    # Collapsible chapter wrapper
      ProseBlock.tsx        # Markdown explanation (the "guide" layer)
      GrammarTable.tsx      # Paradigm table
      ExampleBlock.tsx      # Sentence + gloss
      RuleBlock.tsx         # Highlighted rule callout
      GradationTable.tsx    # K-P-T table
      ExerciseBlock.tsx     # Renders an exercise's items + handles check/reveal
      GrammarTOC.tsx        # Sticky table-of-contents nav
  pages/
    Grammar.tsx             # Assembles everything, no logic
```

`ExerciseBlock.tsx` owns the local check-and-reveal logic for all exercise types (a small switch on `ExerciseType`). The normalized-comparison helper can be lifted from / shared with Practice's local-match code so both use identical matching rules.

---

## Implementation order

1. **Scaffold data file** — create `src/data/grammar.ts` with the **full type definitions** (including prose and exercise types) and the chapter structure with minimal content (just headings), so the page renders correctly end-to-end before content is filled in.
2. **Build components** — implement the block components (prose, table, example, rule, gradation, exercise) and the collapsible `ChapterSection`. Style with Tailwind; match the existing app palette (white cards, gray-50 background, blue accents).
3. **Wire up exercise checking** — implement the local normalized-comparison + reveal logic in `ExerciseBlock`, sharing the matcher with Practice. Verify each exercise type works with a couple of hand-written items.
4. **Fill Kappale 1–5 content** — write prose explanations, tables, examples, and exercises for priority-1 chapters. This is the bulk of the work and can be done chapter by chapter. Each topic should get at least a prose intro, one reference table/rule, and 2–3 exercises of varied types.
5. **Add TOC nav** — once content exists, add the sticky navigation.
6. **Fill Kappale 6–9** — as vocabulary for those chapters is added to the app.

---

## Resolved decisions

- **Self-test approach: client-side only.** Exercises are checked with local normalized string comparison and reveal-answer toggles. No AI, no `/api/check`, no server dependency — the page stays fully static and offline-capable.
- **Prose length is uncapped.** Topics scale from two sentences to several paragraphs; multiple prose blocks can interleave with tables within one topic.
- **K-P-T granularity:** put the *full* consonant-gradation reference in **Kappale 7** (where the textbook goes deep). **Kappale 2** introduces it lightly with 2–3 examples and a "→ see Kappale 7 for the full table" cross-reference. Sections reference each other rather than duplicate content.

## Open questions

- Should example sentences link to the vocabulary word in the Words page? Probably not needed for v1 but worth keeping in mind when structuring the data.
- Should the user be able to mark a grammar topic as "understood"? Could be a nice future addition (stored in localStorage, no backend needed) — fits cleanly with the now client-side-only design.
- Should exercise items be drawn from / cross-referenced with the user's actual vocabulary, or stay hardcoded? Hardcoded for v1 (keeps the data self-contained); revisit once content exists.

---

## Sources

- [Suomen Mestari 1 chapter index — Study Finnish](https://www.studyfinnish.com/other/suomen-mestari-chapter-indexes/suomen-mestari-1-chapter-index/)
- [Suomen mestari series overview — Uusi kielemme](https://uusikielemme.fi/language-levels/textbooks/suomen-mestari-series-finnish-study-books)
- [Uudistettu Suomen mestari 1 — Finn Lectura (publisher)](https://finnlectura.fi/en/products/finnish-as-a-second-language/suomen-mestari/uudistettu-suomen-mestari-1/)
