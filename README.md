# Finnish Learning App

A personal tool for learning Finnish vocabulary. Enter your own words and practise by typing translations from memory.

## Prerequisites

- Node.js 18+
- An Anthropic API key (for AI-powered answer checking)

## Setup

1. **Clone and install dependencies:**

   ```bash
   npm install
   ```

2. **Get an Anthropic API key:**

   Log in at [console.anthropic.com](https://console.anthropic.com), go to **API Keys**, and create a new key.

3. **Create a `.env` file** in the project root:

   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

4. **Seed the database** with the initial word list:

   ```bash
   npm run seed
   ```

5. **Start the app:**

   ```bash
   npm start
   ```

   The app runs at [http://localhost:5173](http://localhost:5173). The Express API runs on port 3001; Vite proxies `/api/*` to it automatically.

## Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start both the Vite dev server and the Express API together |
| `npm run seed` | Parse `initial-translations.md` and insert words (safe to re-run; skips duplicates) |
| `npm run backup` | Copy `finnish.db` to `backups/` with a timestamp |

## Stack

- **Frontend:** React 19 + TypeScript, Vite, Tailwind CSS v4
- **Backend:** Express 5 + better-sqlite3
- **AI:** Anthropic SDK — Claude Haiku for answer checking (server-side only)
- **Database:** SQLite (`finnish.db`, gitignored)
