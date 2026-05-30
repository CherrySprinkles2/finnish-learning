import type { TableContent } from '../../data/grammar'

export default function GrammarTable({ title, content }: { title?: string; content: TableContent }) {
  return (
    <div>
      {title && <h4 className="text-sm font-semibold text-ink-muted mb-2">{title}</h4>}
      <div className="overflow-x-auto rounded-md border border-line">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-base border-b border-line">
              {content.headers.map((h, i) => (
                <th key={i} className="px-4 py-2 font-semibold text-ink-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {content.rows.map((row, r) => (
              <tr key={r} className="border-b border-line-subtle last:border-0">
                {row.map((cell, c) => (
                  <td
                    key={c}
                    className={`px-4 py-2 ${c === 0 ? 'font-semibold text-ink' : 'text-ink-muted'}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
