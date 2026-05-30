import { Fragment, type ReactNode } from 'react'

// Minimal markdown renderer — just what the grammar prose needs, no dependency.
// Supports: paragraphs (blank-line separated), "- " bullet lists,
// inline **bold** and `code`.

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  // Split on **bold** and `code`, keeping the delimiters via capture groups.
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  parts.forEach((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      nodes.push(
        <strong key={i} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>,
      )
    } else if (part.startsWith('`') && part.endsWith('`')) {
      nodes.push(
        <code key={i} className="px-1 py-0.5 rounded-xs bg-overlay text-accent text-[0.95em] font-mono">
          {part.slice(1, -1)}
        </code>,
      )
    } else if (part) {
      nodes.push(<Fragment key={i}>{part}</Fragment>)
    }
  })
  return nodes
}

export default function Markdown({ text, className = '' }: { text: string; className?: string }) {
  // Split into blocks on blank lines.
  const blocks = text.split(/\n\n+/)

  return (
    <div className={`space-y-3 ${className}`}>
      {blocks.map((block, i) => {
        const lines = block.split('\n')
        const isList = lines.every(l => l.trim().startsWith('- '))

        if (isList) {
          return (
            <ul key={i} className="list-disc pl-5 space-y-1 text-ink-muted leading-relaxed">
              {lines.map((line, j) => (
                <li key={j}>{renderInline(line.trim().slice(2))}</li>
              ))}
            </ul>
          )
        }

        return (
          <p key={i} className="text-ink-muted leading-relaxed">
            {renderInline(block)}
          </p>
        )
      })}
    </div>
  )
}
