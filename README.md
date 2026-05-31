# Finnish Learning App

A personal tool for learning Finnish vocabulary. Enter your own words and practise typing translations from memory, with AI-powered answer checking via Claude Haiku.

## Features

- **Practice** — type translations from English → Finnish or Finnish → English; weighted random selection favours words you find difficult or haven't seen recently
- **Vocabulary management** — add, edit, and delete words, grouped by category
- **Flashcards** — flip, shuffle, and filter cards by category
- **Grammar reference** — structured grammar notes for Kappale 1–5
- **AI answer checking** — Claude Haiku accepts valid alternative translations that aren't stored verbatim, and auto-saves new ones for future local matching

---

## Prerequisites

- **Node.js 18+** — check with `node --version`
- **An Anthropic API key** — used server-side for answer checking

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Get an Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com) and log in (or create an account)
2. Navigate to **API Keys** in the left sidebar
3. Click **Create Key**, give it a name, and copy the key — it starts with `sk-ant-`

### 3. Create a `.env` file

Create a file called `.env` in the project root (it is gitignored):

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

The Express server loads this automatically via `--env-file=.env` — no extra library needed.

### 4. Seed the database

This parses `initial-translations.md` and populates the SQLite database with the starter word list. Safe to re-run — it skips duplicates.

```bash
npm run seed
```

The database file (`finnish.db`) is created in the project root on first run and is gitignored.

### 5. Start the app

```bash
npm start
```

This starts both servers together using `concurrently`:

| Server | URL |
|--------|-----|
| Vite (frontend) | http://localhost:5173 |
| Express (API) | http://localhost:3001 |

Vite proxies all `/api/*` requests to Express, so you only ever need to open the Vite URL.

---

## Available commands

| Command | Description |
|---------|-------------|
| `npm start` | Start both the Vite dev server and the Express API (hot-reloads on changes) |
| `npm run server` | Start only the Express API server |
| `npm run seed` | Parse `initial-translations.md` and populate the database (safe to re-run) |
| `npm run backup` | Copy `finnish.db` to `backups/finnish-<timestamp>.db` |
| `npm run build` | Type-check and build the frontend for production |
| `npm run lint` | Run ESLint |

---

## Adding vocabulary

**Via the UI:** open the Vocabulary page and use the word form at the top of any category.

**Via the seed file:** add words to `initial-translations.md` under a `## Section` heading, then run `npm run seed`. The section heading becomes the word's category. Words already in the database are skipped.

Multiple valid translations are separated by ` / ` (e.g. `koira / peni`). The app treats each alternative as equally correct during practice.

---

## Project structure

```
server/
  db.ts         # SQLite connection, schema creation, and migrations
  index.ts      # Express API routes and Anthropic client
  seed.ts       # Parses initial-translations.md and inserts words
src/
  pages/        # React pages (Home, Practice, Words, Flashcards, Grammar, Quiz)
  components/   # Shared components (NavBar, ChipEditor, grammar blocks)
  data/         # Static grammar content
  lib/          # Local answer-matching logic
  types.ts      # Shared TypeScript interfaces
initial-translations.md   # Source of truth for the starter word list
finnish.db                # SQLite database (gitignored, created on first seed)
```

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript, Vite, Tailwind CSS v4 |
| Backend | Express 5, tsx (no compile step) |
| Database | SQLite via better-sqlite3 |
| AI | Anthropic SDK — Claude Haiku, server-side only |
| Routing | React Router v7 |
