// The user's Anthropic API key, stored in localStorage so it persists across
// sessions. Kept separate from finnish:data so it is never included in data
// export/import. Plaintext is acceptable for a personal, single-machine tool.

const KEY = 'finnish:apiKey'

export function getApiKey(): string | null {
  const k = localStorage.getItem(KEY)
  return k && k.trim() ? k : null
}

export function setApiKey(key: string): void {
  localStorage.setItem(KEY, key.trim())
}

export function clearApiKey(): void {
  localStorage.removeItem(KEY)
}

export function hasApiKey(): boolean {
  return getApiKey() !== null
}
