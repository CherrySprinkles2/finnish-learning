import { NavLink } from 'react-router-dom'

const links = [
  { to: '/practice', label: 'Practice' },
  { to: '/words', label: 'Vocabulary' },
  { to: '/flashcards', label: 'Flashcards' },
  { to: '/progress', label: 'Progress' },
  { to: '/grammar', label: 'Grammar' },
]

export default function NavBar() {
  return (
    <nav className="bg-surface border-b border-line-subtle sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
        <NavLink to="/" className="text-lg font-display font-bold text-ink hover:text-accent transition-colors">
          Finnish Learning
        </NavLink>
        <div className="flex gap-1">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-4 py-1.5 rounded-sm text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent-subtle text-accent'
                    : 'text-ink-muted hover:text-ink hover:bg-base'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
