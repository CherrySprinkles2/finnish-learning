// Storage durability helpers. Requesting "persistent" storage asks the browser
// not to evict this origin's data under storage pressure, and exempts it from
// time-based eviction (notably Safari's deletion of script-written storage after
// ~7 days without a visit). Best-effort: the API isn't in every browser, and
// some grant/deny it heuristically rather than prompting.

export function persistenceSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.storage?.persist
}

export async function isPersisted(): Promise<boolean> {
  if (!navigator.storage?.persisted) return false
  return navigator.storage.persisted()
}

// Returns true if storage is (now) persisted. Safe to call repeatedly.
export async function requestPersistence(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  if (await navigator.storage.persisted()) return true
  return navigator.storage.persist()
}

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (!navigator.storage?.estimate) return null
  const e = await navigator.storage.estimate()
  return { usage: e.usage ?? 0, quota: e.quota ?? 0 }
}
