import { useEffect, useState } from 'react'
import { fetchZendeskStatus, setZendeskDown, replayDeadLetters, type ZendeskAdminStatus, type ZendeskFailureMode } from '../../api'
import styles from './Admin.module.css'

// how the simulated Zendesk outage fails — mirrors the backend ZendeskFailureMode
const FAILURE_MODES: ZendeskFailureMode[] = ['timeout', '503', 'hang']

export const Admin = (): JSX.Element => {
  const [status, setStatus] = useState<ZendeskAdminStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [mode, setMode] = useState<ZendeskFailureMode>('timeout')

  const load = () => {
    setLoading(true)
    setError(null)
    fetchZendeskStatus()
      .then((s) => {
        setStatus(s)
        setMode(s.mode)
      })
      .catch(() => setError('Could not load Zendesk status — is the API running?'))
      .finally(() => setLoading(false))
  }

  // load once on mount; load() is also wired to the Refresh button and re-run after a toggle
  useEffect(() => {
    fetchZendeskStatus()
      .then((s) => {
        setStatus(s)
        setMode(s.mode)
      })
      .catch(() => setError('Could not load Zendesk status — is the API running?'))
      .finally(() => setLoading(false))
  }, [])

  const onToggle = () => {
    if (!status) return
    setPending(true)
    setError(null)
    setZendeskDown(!status.down, mode)
      .then(() => load())
      .catch(() => setError('Could not update Zendesk status'))
      .finally(() => setPending(false))
  }

  const onReplay = () => {
    setPending(true)
    setError(null)
    replayDeadLetters()
      .then(() => load())
      .catch(() => setError('Could not replay dead-letters'))
      .finally(() => setPending(false))
  }

  const tiles = status
    ? [
        { label: 'Status', value: status.down ? 'Down' : 'Up' },
        { label: 'Failure mode', value: status.down ? status.mode : '—' },
        { label: 'Queued escalations', value: String(status.queueDepth) },
        { label: 'Dead-lettered', value: String(status.deadLetterDepth), danger: status.deadLetterDepth > 0 }
      ]
    : []

  return (
    <div className={styles.container}>
      <div className={styles.header}>Admin</div>
      <p className={styles.subtitle}>
        Simulate integration outages to exercise the resilience path. Local prototype only.
      </p>

      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>Zendesk</h2>
        {status && (
          <span className={`${styles.pill} ${status.down ? styles.down : styles.up}`}>
            {status.down ? 'Outage (simulated)' : 'Operational'}
          </span>
        )}
      </div>

      {loading && <div className={styles.muted}>Loading status…</div>}
      {error && <div className={styles.error} role="alert">{error}</div>}

      {status && !loading && (
        <>
          <dl className={styles.stats}>
            {tiles.map((t) => (
              <div key={t.label} className={styles.stat}>
                <dt className={styles.statLabel}>{t.label}</dt>
                <dd className={`${styles.statValue} ${t.danger ? styles.deadLetter : ''}`}>{t.value}</dd>
              </div>
            ))}
          </dl>

          <div className={styles.controls}>
            <label className={styles.modeLabel}>
              <span className={styles.modeLabelText}>Failure mode</span>
              <select
                className={styles.select}
                value={mode}
                disabled={status.down || pending}
                onChange={(e) => setMode(e.target.value as ZendeskFailureMode)}
              >
                {FAILURE_MODES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>

            <button
              className={`${styles.button} ${status.down ? styles.restore : styles.simulate}`}
              onClick={onToggle}
              disabled={pending}
            >
              {pending ? 'Updating…' : status.down ? 'Restore Zendesk' : 'Simulate outage'}
            </button>

            <span className={styles.replayWrap}>
              <button
                className={`${styles.button} ${styles.replay}`}
                onClick={onReplay}
                disabled={pending || status.deadLetterDepth === 0}
                aria-describedby={status.deadLetterDepth === 0 ? 'replay-hint' : undefined}
              >
                {pending
                  ? 'Working…'
                  : status.deadLetterDepth > 0
                    ? `Replay ${status.deadLetterDepth} dead-letter${status.deadLetterDepth === 1 ? '' : 's'}`
                    : 'Replay dead-letters'}
              </button>
              {status.deadLetterDepth === 0 && (
                <span id="replay-hint" role="tooltip" className={styles.tooltip}>
                  No dead-lettered escalations to replay
                </span>
              )}
            </span>

            <button className={styles.refresh} onClick={load} disabled={pending}>↺ Refresh</button>
          </div>
        </>
      )}
    </div>
  )
}
