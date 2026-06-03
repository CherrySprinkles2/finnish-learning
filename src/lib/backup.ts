// Download the current data as a JSON backup file and record that a backup was
// taken (resets the backup reminder). Shared by Settings and the reminder banner.

import { exportData, markBackedUp } from './store'

export function downloadBackup(): void {
  const data = exportData()
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const blob = new Blob([JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `finnish-backup-${stamp}.json`
  a.click()
  URL.revokeObjectURL(url)
  markBackedUp()
}
