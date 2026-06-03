# Multiple-choice study mode — implementation plan

Status: **built** (`src/pages/Quiz.tsx`, routed at `/quiz`, active tile in the Study hub).
This document is the original spec for the fourth study mode, kept for reference.
Decided as **study-only** (no attempt recording), consistent with Matching and Flashcards.

## Goal

Add a multiple-choice exercise so a category can be drilled by **recognition**: show one
word, offer four translations, pick the right one. It's the gentlest active-recall rung
(easier than typed recall, more demanding than passively flipping a flashcard) and it's
the mode that most justifies the category structure — the wrong answers (distractors) are
drawn from the **same category**, so they're plausible (four animals, four colours) rather
than obviously absurd.

## Where it fits

The plumbing already exists from the Matching build:

- **Entry point** — the `ModeHub` in `src/pages/Study.tsx` already lists a "Multiple choice"
  tile, currently rendered as a disabled `soon: true` placeholder. Building this mode means
  flipping that tile to an active link: `to: \`/quiz?category=${cat}\``.
- **Scaffold** — `src/pages/Quiz.tsx` already exists but is **not routed** and is just a
  "Coming soon" placeholder. Repurpose it as the multiple-choice page (keep the filename, or
  rename to `MultipleChoice.tsx` for clarity — either is fine).
- **Route** — add `<Route path="/quiz" element={<Quiz />} />` to `src/App.tsx` (it is not
  there yet).

Reuse the conventions established in `src/pages/Matching.tsx`:
`UNCATEGORISED`, `categoryKey(w)`, `primary(s)` (first ` / ` variant), `shuffle<T>()`, and the
`?category=` URL contract (`null` = no selection, `''` = Uncategorised). Copy these locally —
the codebase intentionally duplicates these small helpers per page rather than sharing a module.

## Page structure

Mirror `Matching.tsx`:

1. **Loader** — `fetch('/api/words')`, spinner while loading.
2. **No category** (`selected === null`) — friendly "Pick a group to play" with a link back to `/study`.
3. **Game** — `<Quiz key={selected} ... />` so switching category remounts and resets state.
   Filter the deck by category exactly as Matching does.

## Question generation

For each question:

- **Direction** — pick per question: `fi_to_en` shows the Finnish word and asks for English,
  `en_to_fi` is the reverse. Default to random per question (matches Practice). Optionally add a
  direction toggle in the header like Flashcards/Practice; random-per-question is the simpler start.
- **Prompt** — `primary()` of the source-language field of the answer word.
- **Correct option** — `primary()` of the target-language field.
- **Distractors** — take 3 other words **from the same category**, use their target-language
  `primary()` value. Shuffle the 4 options.
- De-dupe by display string, not by id — two different words can share a translation
  (e.g. synonyms); never show the same text twice in the options.

### Distractor fallbacks (important edge cases)

- Category with **< 4 words**: top up distractors from the **global** word pool (all categories)
  so there are always 4 options. Filter out any whose target string equals the correct answer.
- Category with **< 2 words**: can't form a question — show the same "needs at least N words"
  message pattern Matching uses, linking back to the hub.
- If even the global pool can't supply 3 unique distractors (tiny database), fall back to fewer
  options rather than crashing.

## Session flow

- Build the question list once: `shuffle(deck)` → one question per word (so every word in the
  category is tested exactly once per pass).
- Show a **progress bar** + `Question X / N` header, same visual language as Matching's round bar.
- On answer:
  - The chosen option highlights **green** (correct) or **red** (wrong); if wrong, also reveal
    the correct option in green.
  - Lock the options, show a **Next** button (and accept Enter / click to advance), matching
    Practice's two-press rhythm.
- After the last question, show a **summary card** (reuse Matching's completion-card layout):
  score `X / N` and accuracy %, with **Play again** (reshuffle) and **Other modes**
  (`/study?category=`) buttons.

## Keyboard support

- Number keys **1–4** select the corresponding option.
- **Enter** advances to the next question once answered.
- This keeps it usable without a mouse, like Practice and Flashcards.

## Attempt recording — decision needed

Matching and Flashcards are currently **study-only** (no DB writes). Multiple choice is a more
genuine recognition test, so it's a reasonable candidate to record attempts via
`POST /api/attempts { word_id, direction, correct }`. Recording would:

- feed the Progress page (accuracy-by-category, struggling/known-well tables), and
- feed the weighted-random selection used by Practice and "Review mistakes".

**Recommendation:** record attempts, but treat recognition as a weaker signal than typed recall —
e.g. only log the **first** answer to each question in a session (ignore replays), and consider
logging only the en/fi direction shown. Final call is the user's; default to recording unless
told otherwise. (Note the same open question was flagged for Matching — decide both together for
consistency.)

## Files to touch

| File | Change |
|------|--------|
| `src/pages/Quiz.tsx` | Replace placeholder with the multiple-choice game (loader → picker guard → game), following `Matching.tsx`. |
| `src/App.tsx` | Add `import Quiz` and `<Route path="/quiz" element={<Quiz />} />`. |
| `src/pages/Study.tsx` | Change the "Multiple choice" mode from `soon: true` to an active `to: \`/quiz?category=${cat}\``. |
| `server/index.ts` | Only if recording attempts — no new endpoint needed, `POST /api/attempts` already exists. |

## Styling notes

- Options: full-width buttons, `bg-surface border-2 border-line`, hover `border-line-strong`.
- Selected-correct: `bg-success-subtle border-success text-success`.
- Selected-wrong: `bg-danger-subtle border-danger text-danger`; revealed answer uses the success style.
- Keep the gold (`text-warning`) / blue (`text-info`) Finnish/English colour cues from Matching
  on the prompt word so the direction is glanceable.
- All colours via semantic utilities only (see the Theming section in `CLAUDE.md`).
