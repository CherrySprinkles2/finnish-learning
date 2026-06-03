# Finnish Learning App

A personal tool for learning Finnish vocabulary. Enter your own words and practise typing translations from memory, with AI-powered answer checking via Claude Haiku.

It's a client-side React app: all your words, practice history, and settings live in your browser's `localStorage`, and the app runs as static files. Each browser keeps its own vocabulary.

## Features

- **Practice** — type translations from English → Finnish or Finnish → English; weighted random selection favours words you find difficult or haven't seen in a while
- **Study modes** — each vocabulary category can be drilled with Flashcards, a Matching game, Multiple choice, or Typed recall
- **Vocabulary management** — add, edit, and delete words, grouped by category; words can hold several valid translations
- **Grammar reference** — structured grammar notes for Kappale 1–5
- **Progress dashboard** — daily activity and accuracy, your struggling and known-well words, and per-category accuracy
- **AI answer checking** — Claude Haiku accepts valid alternative translations that aren't stored verbatim, and auto-saves new ones for future local matching
- **Backups** — export and import your data as a JSON file from the Settings page

---

## Prerequisites

- **Node.js 22+** — check with `node --version`
- **An Anthropic API key** (optional) — enables AI answer checking. Without one, answers are checked against your stored translations only.

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the app

```bash
npm start
```

This runs the Vite dev server. Open the URL it prints (defaults to http://localhost:5173).

### 3. Add your Anthropic API key (optional)

On first run the app offers to save an Anthropic key; you can also add or change it later in **Settings**. The key is stored in your browser's `localStorage` and the app calls Claude directly from the browser.

To get a key: go to [console.anthropic.com](https://console.anthropic.com), open **API Keys**, click **Create Key**, and copy the value (it starts with `sk-ant-`).

---

## Available commands

| Command | Description |
|---------|-------------|
| `npm start` | Start the Vite dev server (hot-reloads on changes) |
| `npm run build` | Type-check and build the static site into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |
| `npm run seed:generate` | Regenerate `src/data/seedWords.ts` from `initial-translations.md` (the starter word list) |

---

## Adding vocabulary

**Via the UI:** open the Vocabulary page and use the word form at the top of any category. This is the way to grow your own list — it's saved straight to your browser.

**Via the starter set:** to change the words new browsers are seeded with, add entries to `initial-translations.md` under a `## Section` heading (the heading becomes the category), then run `npm run seed:generate`. This regenerates the bundled starter list; existing browsers keep their own data.

Multiple valid translations are separated by ` / ` (e.g. `koira / peni`). The app treats each alternative as equally correct during practice.

---

## Project structure

```
scripts/
  generate-seed-data.ts   # parses initial-translations.md → src/data/seedWords.ts
src/
  pages/        # React pages (Home, Practice, Words, Study, Flashcards, Matching, Quiz, Progress, Grammar, Settings, Welcome)
  components/   # Shared components (NavBar, ChipEditor, BackupReminder, grammar blocks)
  data/         # Static grammar content + the auto-generated starter word list
  lib/          # Data store (localStorage), AI answer checking, answer matching, backups
  types.ts      # Shared TypeScript interfaces
initial-translations.md   # Source for the starter word list
public/
  _redirects    # SPA catch-all for Cloudflare Pages
```

---

## Deployment

Hosted on **Cloudflare Pages** via the dashboard's Git integration. Connect the repo and set the build command to `npm run build` and the output directory to `dist`. Every push to `master` builds and deploys; pull requests get preview URLs. `public/_redirects` routes all paths to `index.html` so client-side routing works on direct visits and refreshes.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript, Vite, Tailwind CSS v4 |
| Storage | Browser `localStorage` |
| AI | Anthropic SDK — Claude Haiku, called from the browser |
| Routing | React Router v7 |
| Charts | Recharts (Progress dashboard) |
| Hosting | Cloudflare Pages (static) |
