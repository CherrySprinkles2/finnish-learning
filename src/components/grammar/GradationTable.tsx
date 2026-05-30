import type { GradationContent } from '../../data/grammar'

export default function GradationTable({ title, content }: { title?: string; content: GradationContent }) {
  return (
    <div>
      {title && <h4 className="text-sm font-semibold text-ink-muted mb-2">{title}</h4>}
      <div className="overflow-x-auto rounded-md border border-line">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-base border-b border-line">
              <th className="px-4 py-2 font-semibold text-ink-muted">Strong</th>
              <th className="px-4 py-2 font-semibold text-ink-muted">Weak</th>
              <th className="px-4 py-2 font-semibold text-ink-muted">Example</th>
            </tr>
          </thead>
          <tbody>
            {content.rows.map((row, r) => (
              <tr key={r} className="border-b border-line-subtle last:border-0">
                <td className="px-4 py-2 font-mono font-semibold text-ink">{row.strong}</td>
                <td className="px-4 py-2 font-mono text-accent">{row.weak}</td>
                <td className="px-4 py-2 text-ink-muted">{row.example}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
