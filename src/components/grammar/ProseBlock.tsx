import Markdown from './Markdown'

export default function ProseBlock({ title, text }: { title?: string; text: string }) {
  return (
    <div>
      {title && <h4 className="text-sm font-semibold text-ink-muted mb-2">{title}</h4>}
      <Markdown text={text} />
    </div>
  )
}
