import { useEffect, useRef, useState } from 'react'
import { getApiKey, setApiKey, clearApiKey } from '../lib/apiKey'
import { exportData, importData, isValidImport, getBackupInfo, dataSize } from '../lib/store'
import { downloadBackup } from '../lib/backup'
import { isPersisted, requestPersistence, persistenceSupported } from '../lib/storage'

function formatWhen(ts: number | null): string {
  if (ts === null) return 'never'
  return new Date(ts).toLocaleString()
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export default function Settings() {
  const [keyInput, setKeyInput] = useState('')
  const [keySet, setKeySet] = useState(() => getApiKey() !== null)
  const [keyMsg, setKeyMsg] = useState('')
  const [dataMsg, setDataMsg] = useState('')
  const [dataErr, setDataErr] = useState('')
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const [backup, setBackup] = useState(() => getBackupInfo())
  const fileRef = useRef<HTMLInputElement>(null)

  const data = exportData()

  useEffect(() => {
    isPersisted().then(setPersisted)
  }, [])

  async function enablePersistence() {
    setPersisted(await requestPersistence())
  }

  function saveKey() {
    if (!keyInput.trim()) return
    setApiKey(keyInput)
    setKeyInput('')
    setKeySet(true)
    setKeyMsg('API key saved.')
  }

  function removeKey() {
    clearApiKey()
    setKeySet(false)
    setKeyMsg('API key removed. Only exact matches will be accepted.')
  }

  function handleExport() {
    downloadBackup()
    setBackup(getBackupInfo())
  }

  async function handleImportFile(file: File) {
    setDataMsg('')
    setDataErr('')
    try {
      const parsed = JSON.parse(await file.text())
      if (!isValidImport(parsed)) {
        setDataErr('That file doesn’t look like a Finnish Learning backup.')
        return
      }
      const ok = window.confirm(
        `Import ${parsed.words.length} words and ${parsed.attempts.length} attempts? ` +
          'This REPLACES all current data in this browser.',
      )
      if (!ok) return
      importData(parsed)
      // Pages read the store on mount, so reload to pick up the new data everywhere.
      window.location.reload()
    } catch {
      setDataErr('Could not read that file — is it valid JSON?')
    }
  }

  return (
    <div className="min-h-screen bg-base p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-h3 font-display font-bold text-ink mb-8">Settings</h1>

        {/* API key */}
        <section className="bg-surface rounded-lg border border-line shadow-sm p-6 mb-6">
          <h2 className="text-body font-semibold text-ink mb-1">Anthropic API key</h2>
          <p className="text-sm text-ink-faint mb-4">
            Stored in this browser only and used to check answers that aren&rsquo;t exact matches. Without a
            key, only exact matches are accepted.
          </p>
          <p className="text-sm mb-4">
            Status:{' '}
            <span className={keySet ? 'text-success font-semibold' : 'text-ink-muted font-semibold'}>
              {keySet ? 'A key is set' : 'No key set'}
            </span>
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveKey()}
              placeholder={keySet ? 'Enter a new key to replace…' : 'sk-ant-…'}
              autoComplete="off"
              className="flex-1 px-4 py-2.5 rounded-lg border border-line bg-base text-ink placeholder:text-ink-faint focus:outline-none focus:border-focus"
            />
            <button
              onClick={saveKey}
              className="px-5 py-2.5 bg-accent text-on-accent font-semibold rounded-lg hover:bg-accent-hover transition-colors"
            >
              Save key
            </button>
            {keySet && (
              <button
                onClick={removeKey}
                className="px-5 py-2.5 bg-surface text-danger font-semibold rounded-lg border border-line hover:border-danger transition-colors"
              >
                Remove
              </button>
            )}
          </div>
          {keyMsg && <p className="text-sm text-ink-muted mt-3">{keyMsg}</p>}
        </section>

        {/* Data backup */}
        <section className="bg-surface rounded-lg border border-line shadow-sm p-6">
          <h2 className="text-body font-semibold text-ink mb-1">Your data</h2>
          <p className="text-sm text-ink-faint mb-2">
            {data.words.length} words · {data.attempts.length} attempts. Browser storage isn&rsquo;t
            permanent — export regularly to keep a backup you can restore later.
          </p>
          <p className="text-sm mb-4">
            Last backup: <span className="font-semibold text-ink">{formatWhen(backup.lastBackup)}</span>
            {backup.hasUnsavedChanges && (
              <span className="text-warning font-semibold"> · changes not yet backed up</span>
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleExport}
              className="px-5 py-2.5 bg-accent text-on-accent font-semibold rounded-lg hover:bg-accent-hover transition-colors"
            >
              Export backup (.json)
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="px-5 py-2.5 bg-surface text-ink font-semibold rounded-lg border border-line hover:border-line-strong transition-colors"
            >
              Import backup…
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImportFile(file)
                e.target.value = '' // allow re-importing the same file
              }}
            />
          </div>
          <p className="text-sm text-ink-faint mt-3">Importing replaces all current data in this browser.</p>
          {dataMsg && <p className="text-sm text-success mt-2">{dataMsg}</p>}
          {dataErr && <p className="text-sm text-danger mt-2">{dataErr}</p>}
        </section>

        {/* Storage durability */}
        <section className="bg-surface rounded-lg border border-line shadow-sm p-6 mt-6">
          <h2 className="text-body font-semibold text-ink mb-1">Storage durability</h2>
          <p className="text-sm text-ink-faint mb-4">
            Persistent storage asks the browser not to evict your data (e.g. under storage pressure, or
            Safari&rsquo;s deletion of unused sites after ~7 days). It doesn&rsquo;t replace backups — keep exporting too.
          </p>
          <p className="text-sm mb-4">
            Status:{' '}
            <span
              className={
                persisted === null
                  ? 'text-ink-muted font-semibold'
                  : persisted
                    ? 'text-success font-semibold'
                    : 'text-warning font-semibold'
              }
            >
              {persisted === null ? 'checking…' : persisted ? 'Persistent' : 'Not persistent'}
            </span>
            <span className="text-ink-faint"> · app data: {formatBytes(dataSize())}</span>
          </p>
          {persistenceSupported() ? (
            !persisted && (
              <button
                onClick={enablePersistence}
                className="px-5 py-2.5 bg-accent text-on-accent font-semibold rounded-lg hover:bg-accent-hover transition-colors"
              >
                Make storage persistent
              </button>
            )
          ) : (
            <p className="text-sm text-ink-faint">This browser doesn&rsquo;t support the persistence API.</p>
          )}
        </section>
      </div>
    </div>
  )
}
