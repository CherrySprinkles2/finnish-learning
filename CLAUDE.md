# Finnish Learning App

A personal tool for learning Finnish vocabulary. The user enters their own words and practises by typing translations from memory.

## Stack

- **Frontend:** React 19 + TypeScript, Vite, Tailwind CSS v4
- **Backend:** Express 5 + better-sqlite3, running locally via `tsx`
- **AI:** `@anthropic-ai/sdk` — used server-side for answer checking (Claude Haiku, with prompt caching)
- **Database:** SQLite (`finnish.db` in the project root, gitignored)
- **Routing:** React Router v7

## Running the app

```bash
npm start         # starts both servers together via concurrently
npm run seed      # parses initial-translations.md and inserts words (safe to re-run, skips duplicates)
npm run backup    # copies finnish.db to backups/ with a timestamp
```

Vite runs on **port 5173**, Express on **port 3001**. Vite proxies all `/api/*` requests to Express so there are no CORS issues.

The server requires `ANTHROPIC_API_KEY` to be set (loaded via `--env-file=.env`).

## Project structure

```
server/
  db.ts             # Shared SQLite connection + schema + migrations (imported by index.ts and seed.ts)
  index.ts          # Express API + Anthropic client
  seed.ts           # Parses initial-translations.md (incl. ## headers → category) and populates the database
src/
  index.css         # Tailwind import + theme tokens (see Theming below)
  types.ts          # Shared TypeScript interfaces (Word, PracticeWord, Direction)
  lib/
    match.ts        # Local answer-matching (shared by Practice and grammar exercises)
  pages/
    Home.tsx        # Landing page with nav cards
    Practice.tsx    # Typing practice session (with category filter)
    Words.tsx       # Vocabulary management, grouped by category (add / edit / delete / stats)
    Flashcards.tsx  # Per-category flashcard study (flip / shuffle / direction toggle); study-only
    Grammar.tsx     # Grammar reference (Kappale 1–5) — see src/data/grammar.ts
    Quiz.tsx        # Placeholder for future multiple-choice quiz
  components/
    NavBar.tsx      # Sticky top nav shared across all pages
    ChipEditor.tsx  # Chip-based input for words with multiple valid translations
    grammar/        # Grammar block components (ProseBlock, GrammarTable, ExerciseBlock, …)
  data/
    grammar.ts      # Static grammar content (typed chapter/section/block tree)
```

## Theming

The UI uses a single dark theme, **`revontuli`** (northern lights — deep navy surfaces, mint accent). All design tokens live in `src/index.css` and are exposed as Tailwind v4 utilities via `@theme` / `@theme inline`. Components use **semantic utilities only** — never raw Tailwind palette classes (`bg-gray-50`, `text-blue-600`, …) or hard-coded hex.

**How it's wired:**
- Colours are defined as raw CSS variables under `[data-theme="revontuli"]` (e.g. `--bg-surface`, `--text-primary`, `--accent-primary`). `@theme inline` aliases them to Tailwind colour tokens, generating the `bg-`/`text-`/`border-`/`ring-`/`divide-` utilities.
- Fonts, the radius scale, the type scale, and elevation are defined directly in `@theme` (static, theme-independent). `:root` holds the raw `--fs-*` / `--lh-*` / `--space-*` reference values.
- `<html data-theme="revontuli">` (in `index.html`) activates the palette; `color-scheme: dark` makes native controls (selects, scrollbars) render dark. Fonts load via `<link>` in `index.html`.

**Semantic utility vocabulary** (the only colour classes you should write):

| Role | Utilities |
|------|-----------|
| Surfaces | `bg-base` (page), `bg-surface` (cards), `bg-inset`, `bg-elevated`, `bg-overlay` |
| Text → "ink" | `text-ink` (primary), `text-ink-muted`, `text-ink-faint`, `text-ink-disabled`, `text-on-accent` |
| Borders → "line" | `border-line`, `border-line-subtle`, `border-line-strong`, `border-focus` (+ `ring-focus`) |
| Accent (mint, brand) | `bg-accent`, `text-accent`, `bg-accent-hover`, `bg-accent-muted`, `bg-accent-subtle`, `text-accent-emphasis` |
| Status | `text/bg-success`, `…-warning`, `…-danger`, `…-info` (each with a `-subtle` background) |

Conventions: primary actions are `bg-accent text-on-accent`; English word chips use **info** (blue), Finnish chips use **warning** (gold); headings carry `font-display` (Space Grotesk) — body text is Manrope, code/grammar tables are `font-mono` (JetBrains Mono). Type sizes use `text-display` / `text-h1`–`text-h4` / `text-body{,-lg}`; smaller sizes reuse Tailwind's `text-sm`/`text-xs` (already equal to the scale). Recharts colours in `Progress.tsx` reference `var(--…)` directly since they aren't class-based.

**Adding a theme:** add another `[data-theme="name"]` block defining the same colour variables, then set `data-theme` on `<html>`. No component changes needed. (`docs/theming.md` is the original design artifact — `src/index.css` is now the source of truth.)

## Database schema

```sql
words (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  english     TEXT NOT NULL,
  finnish     TEXT NOT NULL,
  category    TEXT,               -- from the "## Section" header in initial-translations.md; null = uncategorised
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
)

attempts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id      INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  direction    TEXT NOT NULL CHECK(direction IN ('en_to_fi', 'fi_to_en')),
  correct      INTEGER NOT NULL,   -- 1 = correct, 0 = wrong
  attempted_at TEXT NOT NULL DEFAULT (datetime('now'))
)
```

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/words` | All words (with `category`) plus attempt stats (total, correct %, last tried), ordered by id |
| POST | `/api/words` | Add a word `{ english, finnish, category? }` |
| PUT | `/api/words/:id` | Update a word's english, finnish, and/or category |
| DELETE | `/api/words/:id` | Delete a word and its attempts |
| GET | `/api/categories` | Distinct non-empty categories with word counts, in markdown order `[{ category, count }]` |
| GET | `/api/practice` | Weighted random word + random direction. Accepts `?exclude=<id>` (avoid repeat), `?category=<name>` (restrict to one category), and `?mode=mistakes` (restrict to recently-struggled words). Returns `null` if the resulting pool is empty |
| POST | `/api/attempts` | Record an attempt `{ word_id, direction, correct }` |
| POST | `/api/check` | AI-powered answer check `{ prompt, user_answer, reference, direction, word_id? }` → `{ correct, feedback }` |

## Practice rules

- Direction is random per round: English → Finnish or Finnish → English
- Marking is **two-phase**:
  1. **Local match first** — the answer is split on `/` and each alternative is compared case-insensitively (parenthetical notes stripped). If any alternative matches, it's immediately marked correct without an API call.
  2. **AI fallback** — if no local match, the answer is sent to `/api/check` (Claude Haiku). The AI is lenient about equally valid translations and phrasing variations, but strict about wrong vocabulary.
- Press **Enter** to check an answer, press **Enter** again (or click Next) to move to the next word
- The previously shown word is always excluded from the next draw (unless that would empty a small category, in which case the exclusion is ignored)
- A **"Don't know"** button marks the word wrong immediately without requiring an answer
- A **category selector** restricts the draw to one category ("All categories" by default); changing it refetches a fresh word
- A **mode toggle** ("All words" / "Review mistakes") restricts the draw to recently-struggled words — <50% correct over the last 5 attempts, last tried within 30 days (the same "struggling" set surfaced on the Progress page). Combinable with the category filter; shows a "No mistakes to review" state when the pool is empty

## Multi-value words and auto-save

Words can store multiple valid translations, separated by ` / ` (e.g. `koira / peni`). The `ChipEditor` component provides a chip-based UI for editing these in the Words page.

When the AI marks an answer correct via `/api/check`, the server checks whether the student's answer is already stored. If it's a new valid translation, it's automatically appended to the word's field (e.g. `koira` → `koira / peni`). This grows the local match list over time so future checks skip the API call.

## Practice word selection — weighted random

Words are not selected with equal probability. Each word gets a weight based on two factors:

**Recency score** (1–5): how long since the word was last attempted
- 1 = attempted today, 5 = not seen in 30+ days (or never)

**Accuracy score** (1–5): correct rate across the last 5 attempts
- 1 = 100% correct, 5 = 0% correct, 3 = never attempted (neutral)

**Weight = recency × accuracy** (range 1–25). A struggling word not seen in a month is up to 25× more likely to appear than a mastered word seen today.

All weighting constants are defined at the top of the `/api/practice` handler in `server/index.ts` and are easy to tune:

```ts
RECENCY_MAX_DAYS = 30   // days at which recency score is capped
RECENCY_MIN = 1         // score for a word attempted today
RECENCY_MAX = 5         // score for a word not seen in RECENCY_MAX_DAYS+ days
ACCURACY_HISTORY = 5    // number of recent attempts used to compute accuracy
ACCURACY_MIN = 1        // score for 100% correct
ACCURACY_MAX = 5        // score for 0% correct
ACCURACY_UNSEEN = 3     // score for a word never attempted
```

## Vocabulary notes

- Words are stored in their **nominative (base) form** — e.g. "espanja" not "espanjaa", "koira" not "koiraa"
- Multiple valid translations are separated by ` / ` in the english and finnish fields
- The initial word list comes from `initial-translations.md` (Kappale 1–6 plus themed sets)

## Categories (grouping)

- Each `## Section` header in `initial-translations.md` becomes the `category` for the rows beneath it. The markdown is the **single source of truth** — `npm run seed` re-applies categories on every run (markdown wins over any manual category change to a seeded word).
- The Vocabulary page groups words into collapsible category cards; Flashcards and the Practice category filter both build their lists from these categories.
- To add a new themed group: add a `## My Group` section to the markdown and run `npm run seed`. Manually-added words (via the UI) can be given any category, including a brand-new one.

## Planned features (not yet built)

- Multiple-choice quiz (page scaffolded, not yet implemented)
- Grammar reference Kappale 7–9 (data structure in place; fill `src/data/grammar.ts` as that vocabulary is added)
- Vocabulary expansion — the user will ask Claude to add themed word sets directly into the database via the seed script or a new markdown file

## What NOT to do

- Do not add audio/listening features — explicitly out of scope
- Do not add a remote backend or authentication — this is a local-only tool
