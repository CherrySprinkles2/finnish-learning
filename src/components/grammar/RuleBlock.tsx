import Markdown from './Markdown'

export default function RuleBlock({ title, text }: { title?: string; text: string }) {
  return (
    <div className="rounded-md border-l-4 border-accent bg-accent-subtle px-4 py-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-accent text-sm">💡</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-accent">
          {title ?? 'Rule'}
        </span>
      </div>
      <Markdown text={text} className="[&_p]:text-ink-muted" />
    </div>
  )
}
