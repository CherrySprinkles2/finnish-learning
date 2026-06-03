import { Link } from 'react-router-dom'

const sections = [
  {
    to: '/practice',
    title: 'Practice',
    description: 'Type translations and track your progress',
    emoji: '✏️',
  },
  {
    to: '/words',
    title: 'Vocabulary',
    description: 'Manage your words and study them by category',
    emoji: '📝',
  },
  {
    to: '/grammar',
    title: 'Grammar',
    description: 'Cases, conjugations, and rules',
    emoji: '📖',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center p-8">
      <h1 className="text-h2 font-display font-bold text-ink mb-2">Finnish Learning</h1>
      <p className="text-ink-faint mb-12">Pick a section to get started</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        {sections.map(({ to, title, description, emoji }) => (
          <Link
            key={to}
            to={to}
            className="bg-surface rounded-lg shadow-sm border border-line-subtle p-6 flex flex-col items-center gap-3 hover:shadow-md hover:border-accent transition-all"
          >
            <span className="text-h2">{emoji}</span>
            <span className="text-lg font-semibold text-ink-muted">{title}</span>
            <span className="text-sm text-ink-faint text-center">{description}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
