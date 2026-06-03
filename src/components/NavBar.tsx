import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/practice', label: 'Practice' },
  { to: '/words', label: 'Vocabulary' },
  { to: '/progress', label: 'Progress' },
  { to: '/grammar', label: 'Grammar' },
  { to: '/settings', label: 'Settings' },
]

export default function NavBar() {
  const [open, setOpen] = useState(false)

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-1.5 rounded-sm text-sm font-medium transition-colors ${
      isActive
        ? 'bg-accent-subtle text-accent'
        : 'text-ink-muted hover:text-ink hover:bg-base'
    }`

  return (
    <nav className="bg-surface border-b border-line-subtle sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
        <NavLink
          to="/"
          onClick={() => setOpen(false)}
          className="text-lg font-display font-bold text-ink hover:text-accent transition-colors"
        >
          Finnish Learning
        </NavLink>

        {/* Desktop links */}
        <div className="hidden sm:flex gap-1">
          {links.map(({ to, label }) => (
            <NavLink key={to} to={to} className={linkClass}>
              {label}
            </NavLink>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle navigation menu"
          aria-expanded={open}
          className="sm:hidden p-2 -mr-2 rounded-sm text-ink-muted hover:text-ink hover:bg-base transition-colors"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="sm:hidden border-t border-line-subtle px-4 py-3 flex flex-col gap-1">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={linkClass}
            >
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  )
}
