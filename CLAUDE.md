# Finnish Learning App

A personal tool for learning Finnish vocabulary. The user enters their own words and practises by typing translations from memory.

## Stack

- **Client-side React app.** A static React 19 + TypeScript SPA (Vite, Tailwind CSS v4) that deploys as flat files. All data and logic live in the browser.
- **Storage:** the browser's `localStorage` (see Data store).
- **AI:** `@anthropic-ai/sdk` — called **directly from the browser** for answer checking (Claude Haiku, prompt caching), using a user-supplied API key and `dangerouslyAllowBrowser: true`.
- **Routing:** React Router v7

It is single-user-per-browser by design: each browser keeps its own vocabulary in `localStorage`.

## Running the app

```bash
npm start            # vite dev server (the only server)
npm run build        # tsc -b && vite build → dist/
npm run seed:generate # regenerate src/data/seedWords.ts from initial-translations.md (Kappale 1–6)
```

Backups are handled **in the app** (Settings → Export / Import a JSON file), not by an npm script.

## Deployment

Hosted on **Cloudflare Pages** via the dashboard's Git integration — no `wrangler.toml`, no Functions, no GitHub Action (it's a pure static SPA). Settings: **build command** `npm run build`, **output directory** `dist`, framework preset Vite. Every push to `master` auto-builds; PRs get preview URLs.

- `public/_redirects` (`/* /index.html 200`) is the SPA catch-all — without it, a direct visit or refresh on any client route (`/practice`, `/quiz`, `/words`, …) 404s instead of loading the app and letting React Router handle it.
- `.nvmrc` pins Node 22 for the build (the toolchain — Vite 8, TypeScript 6 — needs a current Node).
- There are **no server secrets**: the Anthropic key is user-supplied and lives in the visitor's own `localStorage`, and the SDK calls the API directly from the browser. Nothing to configure in the Pages dashboard.

## Project structure

```
scripts/
  generate-seed-data.ts # parses initial-translations.md (## headers → category) → src/data/seedWords.ts
src/
  index.css         # Tailwind import + theme tokens (see Theming below)
  types.ts          # Shared interfaces (Word, PracticeWord, Direction, StoredWord, Attempt, AppData)
  App.tsx           # Onboarding gate (first-run Welcome) + backup-reminder banner; requests persistent storage on mount
  lib/
    store.ts        # THE DATA LAYER — localStorage-backed words/attempts; all read/write/query logic + backup bookkeeping (see Data store)
    ai.ts           # Browser-side AI answer check (@anthropic-ai/sdk, dangerouslyAllowBrowser)
    apiKey.ts       # get/set/clear the Anthropic key in localStorage
    backup.ts       # downloadBackup() — serialise data to a JSON file + mark backed up (shared by Settings + banner)
    storage.ts      # Storage-durability helpers (navigator.storage.persist/persisted/estimate)
    match.ts        # Local answer-matching (shared by Practice and grammar exercises)
  pages/
    Welcome.tsx     # First-run gate: enter the API key (or skip), then continue into the app
    Settings.tsx    # Manage the API key + export/import data JSON + storage-durability panel (persistence, usage, last backup)
    Home.tsx        # Landing page with nav cards
    Practice.tsx    # Typing practice session (category filter; accepts ?category= from the Study hub)
    Words.tsx       # Vocabulary management, grouped by category (add / edit / delete / stats); each category has a "Study →" button → Study hub
    Study.tsx       # Per-category study hub: picks an exercise mode (Flashcards / Matching / Typed recall / Multiple choice). Reached as /study?category=<name>; /study with no category redirects to Words
    Flashcards.tsx  # Per-category flashcard deck (flip / shuffle / direction toggle); study-only. Launched from the Study hub; /flashcards with no category redirects to Words
    Matching.tsx    # Per-category matching game (tap Finnish ↔ English, rounds of 6); study-only. Launched from the Study hub
    Progress.tsx    # Stats dashboard (daily activity/accuracy, struggling/known-well words, per-category accuracy) — recharts; reads store.getStats()
    Grammar.tsx     # Grammar reference (Kappale 1–5) — see src/data/grammar.ts
    Quiz.tsx        # Per-category multiple-choice game (pick the right translation from four; distractors from the same category). Study-only. Launched from the Study hub as /quiz?category=
  components/
    NavBar.tsx      # Sticky top nav shared across all pages
    BackupReminder.tsx # Dismissible "you have un-backed-up changes" banner (see Data durability)
    ChipEditor.tsx  # Chip-based input for words with multiple valid translations
    grammar/        # Grammar block components (ProseBlock, GrammarTable, ExerciseBlock, …)
  data/
    grammar.ts      # Static grammar content (typed chapter/section/block tree)
    seedWords.ts    # AUTO-GENERATED Kappale 1–6 starter words (npm run seed:generate); seeded on first run
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

**Adding a theme:** add another `[data-theme="name"]` block defining the same colour variables, then set `data-theme` on `<html>`. No component changes needed. (`src/index.css` is the source of truth for theme tokens.)

## Data store (`src/lib/store.ts`)

All data lives in `localStorage` and is read/written through `store.ts` — the single source of truth for words and attempt history. Pages import its functions and call them synchronously.

**localStorage keys:**
- `finnish:data` → `{ version, words[], attempts[], nextWordId, nextAttemptId }` (the `AppData` shape in `types.ts`). Words: `{ id, english, finnish, category, created_at }`. Attempts: `{ id, word_id, direction, correct (boolean), attempted_at }`. IDs are numeric, assigned from the monotonic counters. Timestamps use `YYYY-MM-DD HH:MM:SS` UTC format; the Progress page parses them by appending `'Z'`.
- `finnish:apiKey` → the Anthropic key (separate key; never included in export/import).
- `finnish:onboarded` → `"1"` once the first-run gate is dismissed.
- `finnish:lastModified` / `finnish:lastBackup` → epoch-ms timestamps driving the backup reminder (see Data durability).

**Seeding:** on first run (`finnish:data` absent), the store seeds the Kappale 1–6 starter words from `src/data/seedWords.ts`. A deliberate clear to an empty list keeps the key present, so it never silently re-seeds.

**Functions:**

| Function | Notes |
|----------|-------|
| `getWords()` | Words joined with per-word attempt stats (total, correct count, last tried), ordered by id |
| `addWord` / `updateWord` / `deleteWord` | `deleteWord` cascades to the word's attempts |
| `getCategories()` | Distinct non-empty categories + counts, in insertion (min-id) order |
| `getPractice({exclude?, category?, mode?})` | Weighted random word + random direction; `null` if the pool is empty (see weighting below) |
| `recordAttempt({word_id, direction, correct})` | Appends an attempt |
| `getStats()` | `{ daily, struggling, knownWell, categoryAccuracy }` for the Progress page |
| `appendTranslation(id, direction, answer)` | Adds a newly-confirmed translation to a word's field (auto-save) |
| `exportData` / `importData` / `isValidImport` | Settings backup: export the blob, replace it from an imported file (validates shape, recomputes counters) |
| `markBackedUp` / `getBackupInfo` / `shouldRemindBackup` | Backup-reminder bookkeeping (see Data durability) |

The AI check lives separately in `src/lib/ai.ts` (`checkAnswer(...)`), since it makes a network call.

## Data durability & backups

`localStorage` survives tab/browser close but **can** be lost to: the user clearing site data, private windows, browser eviction under storage pressure, or Safari deleting script-written storage after ~7 days without a visit. Two defences:

- **Persistent storage:** `App.tsx` calls `requestPersistence()` (`src/lib/storage.ts` → `navigator.storage.persist()`) on mount — best-effort, asks the browser not to evict the origin. Settings shows the status, the app-data size (`store.dataSize()` — bytes of the `finnish:data` blob, not the misleading whole-origin `navigator.storage.estimate()`), and a "Make storage persistent" button.
- **Backups:** the only true safety net. `downloadBackup()` (`src/lib/backup.ts`) writes the data JSON and calls `markBackedUp()`. Import also counts as a backup point. Every write sets `finnish:lastModified`; export/import sets `finnish:lastBackup`.
- **Reminder banner:** `shouldRemindBackup()` gates `BackupReminder` — deliberately conservative (nudge, not nag): only when there are attempts to lose **and** there are changes since the last backup **and** (never backed up, or the last backup is ≥7 days old). Dismissible per session via `sessionStorage` `finnish:backupBannerDismissed`. It is **not** a `beforeunload` prompt (closing doesn't lose data; that would nag without protecting anything).

## Practice rules

- Direction is random per round: English → Finnish or Finnish → English
- Marking is **two-phase**:
  1. **Local match first** (`src/lib/match.ts`) — the answer is split on `/` and each alternative is compared case-insensitively (parenthetical notes stripped). If any alternative matches, it's immediately marked correct without an API call.
  2. **AI fallback** (`src/lib/ai.ts` `checkAnswer`) — if no local match, the answer is sent to Claude Haiku **directly from the browser**. The AI is lenient about equally valid translations and phrasing variations, but strict about wrong vocabulary. **If no API key is set**, this phase can't run, so the answer is marked **wrong** (only exact matches are accepted) with a hint pointing at Settings.
- Press **Enter** to check an answer, press **Enter** again (or click Next) to move to the next word
- The previously shown word is always excluded from the next draw (unless that would empty a small category, in which case the exclusion is ignored)
- A **"Don't know"** button marks the word wrong immediately without requiring an answer
- A **category selector** restricts the draw to one category ("All categories" by default); changing it refetches a fresh word
- A **mode toggle** ("All words" / "Review mistakes") restricts the draw to recently-struggled words — <50% correct over the last 5 attempts, last tried within 30 days (the same "struggling" set surfaced on the Progress page). Combinable with the category filter; shows a "No mistakes to review" state when the pool is empty

## Study modes (per-category)

Studying is organised around the vocabulary categories rather than a single flashcard page. There is **no standalone Flashcards nav item** — the only entry point is the **"Study →" button** on each category card in the Vocabulary page.

Flow: **Vocabulary → "Study →" → Study hub (`/study?category=<name>`) → a mode**. The hub (`Study.tsx`) shows one tile per exercise mode for that category:

| Mode | Route | Notes |
|------|-------|-------|
| Flashcards | `/flashcards?category=` | Flip/shuffle/direction-toggle deck (`Flashcards.tsx`). Study-only. |
| Matching | `/matching?category=` | Tap-to-pair Finnish ↔ English in rounds of `ROUND_SIZE` (6); progress bar + mistake count (`Matching.tsx`). Study-only. |
| Typed recall | `/practice?category=` | Reuses `Practice.tsx`, which seeds its category filter from the `?category=` param. Records attempts. |
| Multiple choice | `/quiz?category=` | Pick the right translation from four; distractors drawn from the same category (topped up from the global pool when the category is small). Random direction per question; keys 1–4 select, Enter advances. Study-only (`Quiz.tsx`). |

Conventions shared by the study pages: `?category=` is the contract (`null` = no selection → redirect to Vocabulary; `''` = Uncategorised; otherwise the exact category name). Tiles/cards display only the **first ` / ` variant** of a word to stay compact. Matching and Flashcards are **study-only** (no `recordAttempt` writes), so they don't affect Progress stats or practice weighting; only Typed recall records attempts. Back-links from a deck/game return to that category's hub (`/study?category=`).

## Multi-value words and auto-save

Words can store multiple valid translations, separated by ` / ` (e.g. `koira / peni`). The `ChipEditor` component provides a chip-based UI for editing these in the Words page.

When the AI marks an answer correct (`ai.ts` → `store.appendTranslation`), the store checks whether the student's answer is already stored. If it's a new valid translation, it's automatically appended to the word's field (e.g. `koira` → `koira / peni`). This grows the local match list over time so future checks skip the API call.

## Practice word selection — weighted random

Words are not selected with equal probability. Each word gets a weight based on two factors:

**Recency score** (1–5): how long since the word was last attempted
- 1 = attempted today, 5 = not seen in 30+ days (or never)

**Accuracy score** (1–5): correct rate across the last 5 attempts
- 1 = 100% correct, 5 = 0% correct, 3 = never attempted (neutral)

**Weight = recency × accuracy** (range 1–25). A struggling word not seen in a month is up to 25× more likely to appear than a mastered word seen today.

All weighting constants are defined near the top of `src/lib/store.ts` (the practice section) and are easy to tune:

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

- Each `## Section` header in `initial-translations.md` becomes the `category` for the rows beneath it. The markdown is the source of truth for the **starter set only**: `npm run seed:generate` regenerates `src/data/seedWords.ts`, which is seeded into a browser **once** on first run.
- After first run the user's `localStorage` is authoritative — there is no re-seed, so manual edits/categories in the UI persist and are never overwritten.
- The Vocabulary page groups words into collapsible category cards; the Study hub, its exercise modes, and the Practice category filter all build their lists from these categories.
- To add words to an existing browser: add them via the Vocabulary UI (any category, including a new one). To change the bundled starter set new users get: edit the markdown and run `npm run seed:generate`.

## Planned features (not yet built)

- Grammar reference Kappale 7–9 (data structure in place; fill `src/data/grammar.ts` as that vocabulary is added)
- Vocabulary expansion — the user will ask Claude to add themed word sets, either into the bundled starter set (markdown → `npm run seed:generate`) or directly via the Vocabulary UI

## What NOT to do

- **Never run git commands that write or change state** — no `commit`, `add`, `branch`, `checkout`, `push`, `merge`, `rebase`, `reset`, `stash`, `tag`, etc. Read-only git (`status`, `log`, `diff`, `show`) is fine. The user manages all git operations themselves; stage and commit nothing on their behalf.
- Do not add audio/listening features — explicitly out of scope
- Do not start the dev server (`npm start`) — the user runs it themselves
