import type { ExampleContent } from '../../data/grammar'

export default function ExampleBlock({ content }: { content: ExampleContent }) {
  return (
    <div className="rounded-md bg-base border border-line px-4 py-3">
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {content.words.map((w, i) => (
          <div key={i} className="flex flex-col">
            <span className="text-base font-semibold text-ink">{w.fi}</span>
            <span className="text-xs text-ink-faint">{w.en}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-sm italic text-ink-faint">“{content.translation}”</p>
    </div>
  )
}
