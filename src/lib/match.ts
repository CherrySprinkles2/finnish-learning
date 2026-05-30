// Shared local answer-matching used by Practice (first phase) and the Grammar
// page exercises. Case-insensitive, trims, strips parenthetical notes, and
// treats `/`-separated alternatives as all valid.

export function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim()
}

export function isLocalMatch(answer: string, reference: string): boolean {
  const a = normalize(answer)
  if (!a) return false
  return reference.split('/').some(alt => normalize(alt) === a)
}
