import { useState, useEffect } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface DailyPoint { day: string; attempts: number; correct: number }
interface StrugglingWord {
  id: number; english: string; finnish: string
  recent_attempts: number; recent_correct: number; last_attempted: string
}
interface KnownWellWord {
  id: number; english: string; finnish: string; category: string | null
  recent_attempts: number; recent_correct: number; last_attempted: string
}
interface CategoryAccuracy {
  category: string; word_count: number; total_attempts: number; correct_attempts: number
}
interface Stats {
  daily: DailyPoint[]
  struggling: StrugglingWord[]
  knownWell: KnownWellWord[]
  categoryAccuracy: CategoryAccuracy[]
}

function formatDay(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
}

function getLast30Days() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().split('T')[0]
  })
}

function computeStreak(daily: DailyPoint[]) {
  const daySet = new Set(daily.map(d => d.day))
  const today = new Date().toISOString().split('T')[0]
  const cursor = new Date()
  if (!daySet.has(today)) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (daySet.has(cursor.toISOString().split('T')[0])) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function catBarColor(accuracy: number) {
  if (accuracy >= 75) return 'var(--success)'
  if (accuracy >= 50) return 'var(--warning)'
  return 'var(--danger)'
}

const tooltipStyle = {
  borderRadius: 8,
  border: '1px solid var(--border-default)',
  backgroundColor: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  fontSize: 13,
}
const tooltipLabelStyle = { color: 'var(--text-secondary)', fontWeight: 600 }
const tooltipItemStyle = { color: 'var(--text-primary)' }
const tickStyle = { fontSize: 11, fill: 'var(--text-tertiary)' }
const GRID = 'var(--border-subtle)'

function WordTable({ words, variant }: {
  words: (StrugglingWord | KnownWellWord)[]
  variant: 'success' | 'danger'
}) {
  return (
    <div className="overflow-x-auto">
    <table className="w-full text-body">
      <thead className="bg-base text-ink-muted text-sm uppercase tracking-wider border-b border-line">
        <tr>
          <th className="text-left px-5 py-3 font-medium">English</th>
          <th className="text-left px-5 py-3 font-medium">Finnish</th>
          <th className="text-left px-5 py-3 font-medium">Recent accuracy</th>
          <th className="text-left px-5 py-3 font-medium">Last tried</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line-subtle">
        {words.map(w => {
          const pct = Math.round((w.recent_correct / w.recent_attempts) * 100)
          return (
            <tr key={w.id} className="hover:bg-base">
              <td className="px-5 py-3">
                <div className="flex flex-wrap gap-1">
                  {w.english.split('/').map((c, i) => (
                    <span key={i} className="px-2 py-0.5 bg-info-subtle text-info text-sm font-medium rounded-xs">{c.trim()}</span>
                  ))}
                </div>
              </td>
              <td className="px-5 py-3">
                <div className="flex flex-wrap gap-1">
                  {w.finnish.split('/').map((c, i) => (
                    <span key={i} className="px-2 py-0.5 bg-warning-subtle text-warning text-sm font-medium rounded-xs">{c.trim()}</span>
                  ))}
                </div>
              </td>
              <td className="px-5 py-3">
                <span className={`px-2 py-0.5 rounded-xs text-sm font-medium ${
                  variant === 'success' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'
                }`}>
                  {pct}% ({w.recent_correct}/{w.recent_attempts})
                </span>
              </td>
              <td className="px-5 py-3 text-ink-muted">
                {new Date(w.last_attempted + 'Z').toLocaleDateString()}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
    </div>
  )
}

export default function Progress() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats)
  }, [])

  if (!stats) return <div className="min-h-screen bg-base p-8 text-ink-faint">Loading…</div>

  const { daily, struggling, knownWell, categoryAccuracy } = stats

  const dailyMap = new Map(daily.map(d => [d.day, d]))
  const last30 = getLast30Days().map(day => {
    const d = dailyMap.get(day)
    return {
      day, label: formatDay(day),
      attempts: d?.attempts ?? 0,
      accuracy: d ? Math.round((d.correct / d.attempts) * 100) : null,
    }
  })

  const catData = categoryAccuracy.map(c => ({
    ...c,
    accuracy: c.total_attempts > 0 ? Math.round(c.correct_attempts / c.total_attempts * 100) : 0,
  }))

  const totalAttempts = daily.reduce((s, d) => s + d.attempts, 0)
  const totalCorrect  = daily.reduce((s, d) => s + d.correct, 0)
  const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0
  const streak = computeStreak(daily)

  const statCards = [
    { label: 'Total attempts', value: totalAttempts.toLocaleString() },
    { label: 'Overall accuracy', value: `${overallAccuracy}%` },
    { label: 'Known well', value: knownWell.length.toString() },
    { label: 'Day streak', value: `${streak}d` },
  ]

  return (
    <div className="min-h-screen bg-base p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-h3 font-display font-bold text-ink mb-8">Progress</h1>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ label, value }) => (
            <div key={label} className="bg-surface rounded-lg border border-line shadow-sm p-5">
              <div className="text-h3 font-display font-bold text-ink">{value}</div>
              <div className="text-sm text-ink-muted mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Daily activity + accuracy */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-surface rounded-lg border border-line shadow-sm p-6">
            <h2 className="text-body font-semibold text-ink-muted mb-4">Daily activity — last 30 days</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={last30} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="label" tick={tickStyle} interval={4} />
                <YAxis tick={tickStyle} allowDecimals={false} />
                <Tooltip
                  formatter={(v) => [v, 'attempts']}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="attempts" fill="var(--accent-primary)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-surface rounded-lg border border-line shadow-sm p-6">
            <h2 className="text-body font-semibold text-ink-muted mb-4">Daily accuracy — last 30 days</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={last30.filter(d => d.accuracy !== null)}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="label" tick={tickStyle} interval="preserveStartEnd" />
                <YAxis tick={tickStyle} domain={[0, 100]} unit="%" />
                <Tooltip
                  formatter={(v) => [`${v}%`, 'accuracy']}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  contentStyle={tooltipStyle}
                />
                <Line dataKey="accuracy" stroke="var(--info)" strokeWidth={2} dot={{ r: 3, fill: "var(--info)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category accuracy */}
        <div className="bg-surface rounded-lg border border-line shadow-sm p-6 mb-6">
          <h2 className="text-body font-semibold text-ink-muted mb-1">Accuracy by category</h2>
          <p className="text-sm text-ink-faint mb-4">Based on last 5 attempts per word</p>
          {catData.length === 0 ? (
            <p className="text-ink-faint text-sm py-10 text-center">No attempts yet — start practising!</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(180, catData.length * 44)}>
              <BarChart layout="vertical" data={catData} margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                <XAxis type="number" domain={[0, 100]} unit="%" tick={tickStyle} />
                <YAxis type="category" dataKey="category" tick={tickStyle} width={120} />
                <Tooltip
                  formatter={(v, _name, props) => {
                    const { correct_attempts, total_attempts } = props.payload as CategoryAccuracy & { accuracy: number }
                    return [`${v}%  (${correct_attempts}/${total_attempts} attempts)`, 'accuracy']
                  }}
                  labelStyle={tooltipLabelStyle}
                  itemStyle={tooltipItemStyle}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="accuracy" radius={[0, 3, 3, 0]}>
                  {catData.map((entry, i) => (
                    <Cell key={i} fill={catBarColor(entry.accuracy)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Words you know well */}
        <div className="bg-surface rounded-lg border border-line shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-line-subtle">
            <h2 className="text-body font-semibold text-ink-muted">Words you know well</h2>
            <p className="text-sm text-ink-faint mt-0.5">≥80% in last 5 attempts, at least 3 attempts, tried in the past 60 days</p>
          </div>
          {knownWell.length === 0 ? (
            <p className="text-ink-faint text-sm py-10 text-center">Nothing here yet — keep practising!</p>
          ) : (
            <WordTable words={knownWell} variant="success" />
          )}
        </div>

        {/* Struggling words */}
        <div className="bg-surface rounded-lg border border-line shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-line-subtle">
            <h2 className="text-body font-semibold text-ink-muted">Recently struggling</h2>
            <p className="text-sm text-ink-faint mt-0.5">Under 50% in last 5 attempts, tried in the past 30 days</p>
          </div>
          {struggling.length === 0 ? (
            <p className="text-ink-faint text-sm py-10 text-center">Nothing here — you're doing great!</p>
          ) : (
            <WordTable words={struggling} variant="danger" />
          )}
        </div>

      </div>
    </div>
  )
}
