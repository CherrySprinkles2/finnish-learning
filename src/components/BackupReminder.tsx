import { useState } from 'react'
import { shouldRemindBackup } from '../lib/store'
import { downloadBackup } from '../lib/backup'

// A dismissible nudge shown only when there are un-backed-up changes worth
// protecting (see store.shouldRemindBackup). Not a "before you close" prompt —
// closing the tab doesn't lose localStorage; eviction and clearing do.
const DISMISS_KEY = 'finnish:backupBannerDismissed'

export default function BackupReminder() {
  const [hidden, setHidden] = useState(
    () => !shouldRemindBackup() || sessionStorage.getItem(DISMISS_KEY) === '1',
  )
  if (hidden) return null

  return (
    <div className="bg-warning-subtle border-b border-warning">
      <div className="max-w-4xl mx-auto px-6 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="text-ink flex-1 min-w-[12rem]">
          You have changes that aren&rsquo;t backed up. Export a copy so you don&rsquo;t lose your progress.
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              downloadBackup()
              setHidden(true)
            }}
            className="px-3 py-1 rounded-sm bg-accent text-on-accent font-semibold hover:bg-accent-hover transition-colors"
          >
            Back up now
          </button>
          <button
            onClick={() => {
              sessionStorage.setItem(DISMISS_KEY, '1')
              setHidden(true)
            }}
            className="px-3 py-1 rounded-sm text-ink-muted hover:text-ink transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  )
}
