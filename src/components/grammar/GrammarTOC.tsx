import type { GrammarChapter } from '../../data/grammar'

export default function GrammarTOC({
  chapters,
  onJump,
}: {
  chapters: GrammarChapter[]
  onJump: (number: number) => void
}) {
  return (
    <nav className="sticky top-20">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint mb-3 px-3">
        Chapters
      </p>
      <ul className="space-y-0.5">
        {chapters.map(ch => (
          <li key={ch.number}>
            <button
              onClick={() => onJump(ch.number)}
              className="w-full text-left px-3 py-1.5 rounded-sm text-sm text-ink-muted hover:bg-overlay hover:text-ink transition-colors"
            >
              <span className="font-medium">Kappale {ch.number}</span>
              <span className="block text-xs text-ink-faint truncate">{ch.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
