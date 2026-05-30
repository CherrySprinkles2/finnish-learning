# Cloudflare Migration Plan

A plan for moving the Finnish Learning app from a local-only tool (Express + `better-sqlite3` + a local `finnish.db`) to Cloudflare, with per-user data and authentication.

This document is the living checklist for the migration. Tick items off as they land.

---

## Decisions (locked in)

| Question | Decision |
|----------|----------|
| **Auth** | **Cloudflare Access** (Zero Trust). Login wall in front of the app; the Worker reads a verified email from the injected JWT. No password table, no token in browser storage. |
| **User scope** | **Small fixed set** of people, added by email allowlist in the Cloudflare dashboard. Not open self-registration. |
| **API hosting** | **Same Pages project** as the frontend, via Pages Functions. Same-origin `/api/*` → no CORS. |
| **New-user seeding** | Every new user starts with a **copy of the Kappale 1–6 seed word sets** from `initial-translations.md` (seeded on first login). |

---

## Why the current backend can't move as-is

Two hard blockers in `server/`:

1. **`better-sqlite3` is a native, synchronous Node module.** Cloudflare Workers run on a V8-isolate runtime (not Node) with no filesystem, so it cannot load there. Replacement: **Cloudflare D1**, which *is* SQLite — the schema ports over — but its API is **async**, so every handler becomes `async` and every query is awaited.
2. **Express won't run on Workers.** Replacement: **[Hono](https://hono.dev)**, a deliberately Express-like router that runs natively on Workers/Pages Functions. Route bodies port over with minimal reshaping.

What carries over cleanly:
- The **SQL itself** — D1 supports the SQLite functions in use (`julianday`, `datetime`, window functions, CTEs in the practice-weighting and stats queries).
- The **Anthropic SDK** — it's `fetch`-based and runs on Workers. The key becomes a Worker secret; prompt caching still works.

---

## Target architecture

```
Browser ──> Cloudflare Access (login wall, email allowlist)
              │  injects Cf-Access-Jwt-Assertion header (verified email)
              ▼
         Cloudflare Pages
           ├── static React build (vite build output)
           └── Pages Functions (Hono)  ── same-origin /api/*  (no CORS)
                    │
                    ├── D1 binding (env.DB)        ← SQLite, the schema below
                    └── ANTHROPIC_API_KEY (secret) ← used by /api/check
```

**User identity** = the verified email from the Access JWT. Access gates the request *before* any app code runs, so there is no password logic to write and no token to store in `sessionStorage`/`localStorage`.

---

## Data model changes

Add a `user_id TEXT` to both tables and filter every query by it. With Cloudflare Access, `user_id` is the JWT email.

```sql
words (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT NOT NULL,          -- NEW: email from the Access JWT
  english     TEXT NOT NULL,
  finnish     TEXT NOT NULL,
  category    TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
)

attempts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      TEXT NOT NULL,         -- NEW (denormalised for direct filtering)
  word_id      INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  direction    TEXT NOT NULL CHECK(direction IN ('en_to_fi', 'fi_to_en')),
  correct      INTEGER NOT NULL,
  attempted_at TEXT NOT NULL DEFAULT (datetime('now'))
)

-- Indexes for the per-user filtering that every query now does
CREATE INDEX idx_words_user      ON words(user_id);
CREATE INDEX idx_attempts_user   ON attempts(user_id);
CREATE INDEX idx_attempts_word   ON attempts(word_id);
```

Every endpoint gains `WHERE user_id = ?` bound to the caller's email. The `/api/check` auto-save (appending a new valid translation, e.g. `koira` → `koira / peni`) must also filter by `user_id` so users can't read or mutate each other's words.

---

## Work breakdown

### 1. Tooling setup
- [ ] Add `wrangler` (dev dep) and `hono` (dep). Remove the server-only `concurrently`/`tsx` path once the Functions runtime works.
- [ ] Add `wrangler.toml`: Pages project name, D1 binding (`DB`), compatibility date/flags (`nodejs_compat` for the Anthropic SDK).
- [ ] Rewrite `npm start`: `wrangler pages dev` (built frontend + Functions + local D1 via Miniflare) alongside `vite` for HMR. The Vite `/api/*` proxy stays dev-only.
- [ ] **Dev server is run by the user — never launch it automatically.**

### 2. Database → D1
- [ ] Convert the `db.ts` `CREATE TABLE` block into a D1 migration (`wrangler d1 migrations create`), including `user_id` columns and indexes above.
- [ ] Apply migrations locally and to the remote D1 (`wrangler d1 migrations apply`).
- [ ] **One-off data migration:** export the existing local `finnish.db` and import into D1, tagging every existing row with your own email as `user_id`, so your real vocab + attempt history survive.

### 3. API → Hono on Pages Functions
- [ ] Port each route from `server/index.ts`:
  - `db.prepare(...).get/all/run` → `await env.DB.prepare(...).bind(...).first/all/run` (handlers become `async`).
  - Add `WHERE user_id = ?` to every query.
  - The practice-weighting and stats SQL carry over — but **test the heavier stats CTEs against D1 specifically** for its per-query row/time limits.
- [ ] **Auth middleware:** verify the `Cf-Access-Jwt-Assertion` JWT (fetch CF's public keys, check `aud` + issuer), extract the email, reject if absent. This replaces the originally-considered password check entirely.

### 4. AI answer check
- [ ] `wrangler secret put ANTHROPIC_API_KEY`.
- [ ] Port `/api/check` (SDK works as-is). Keep prompt caching on the system prompt.
- [ ] Add `user_id` to the auto-save lookup/update.

### 5. Seeding (new-user onboarding)
- [ ] Rework `server/seed.ts`: it currently parses `initial-translations.md` with `better-sqlite3`. For D1, either emit SQL run via `wrangler d1 execute` or use the D1 API. Keep the markdown as the single source of truth for categories.
- [ ] **First-login seeding:** when an allowlisted email appears with zero words, copy the Kappale 1–6 seed sets into that `user_id`. (Per the locked-in decision — every new user starts with the full seed list, not empty.)

### 6. Backups & ops
- [ ] Replace `npm run backup` (a local file copy) with `wrangler d1 export` on a schedule.
- [ ] Note **D1 Time Travel** (30-day point-in-time restore) as the safety net.

---

## Things to watch (gotchas)

- **Schema/DDL can't run per-request.** Today `db.ts` runs `CREATE TABLE`/`ALTER TABLE` on every startup; on D1 that moves to the migrations system, run ahead of time.
- **Anthropic cost exposure.** Multi-user means `/api/check` could be hammered. The Access allowlist largely neutralises this (only known emails get through); revisit rate limiting if the user set ever grows.
- **D1 query limits.** Generous free tier, but queries have row/time ceilings — the stats endpoint is the one to validate.
- **`sessionStorage` was a dead end anyway** — it clears on tab close. Moot under Access, which is why we're not building token storage at all.
- **Out of scope (unchanged from project rules):** no audio/listening features; no auth/backend *beyond* this Cloudflare move; this remains a small-audience tool, not a public product.

---

## Suggested order of execution

1. Tooling + `wrangler.toml` + D1 binding (step 1).
2. D1 migration + import existing data (step 2).
3. Port read endpoints (`/api/words`, `/api/categories`, `/api/practice`, `/api/stats`) behind a stub `user_id`, verify locally (step 3, partial).
4. Add Access JWT middleware and wire `user_id` from it (step 3).
5. Port write endpoints + `/api/check` + auto-save (steps 3–4).
6. First-login seeding (step 5).
7. Deploy to Pages, configure Access allowlist, set the secret, backups (steps 1, 4, 6).
