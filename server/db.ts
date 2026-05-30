import Database from 'better-sqlite3'

// Single shared SQLite connection + schema, imported by both the API server
// (index.ts) and the seed script (seed.ts) so the schema never drifts.
export const db = new Database('finnish.db')

db.exec(`
  CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    english TEXT NOT NULL,
    finnish TEXT NOT NULL,
    category TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    direction TEXT NOT NULL CHECK(direction IN ('en_to_fi', 'fi_to_en')),
    correct INTEGER NOT NULL,
    attempted_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

// Migration: add the category column to databases created before it existed.
// CREATE TABLE IF NOT EXISTS won't alter an existing table, so do it explicitly.
const columns = db.prepare(`PRAGMA table_info(words)`).all() as { name: string }[]
if (!columns.some(c => c.name === 'category')) {
  db.exec(`ALTER TABLE words ADD COLUMN category TEXT`)
}
