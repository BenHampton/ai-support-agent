import { useEffect, useState } from 'react'
import { fetchZendeskStatus, setZendeskDown, type ZendeskAdminStatus, type ZendeskFailureMode } from '../../api'
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>Admin</div>
      <p className={styles.subtitle}>
        Simulate integration outages to exercise the resilience path. Local prototype only.
      </p>

      <section className={styles.card} aria-labelledby="zendesk-heading">
        <div className={styles.cardHead}>
          <h2 id="zendesk-heading" className={styles.cardTitle}>Zendesk</h2>
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
            <dl className={styles.meta}>
              <div className={styles.metaRow}>
                <dt className={styles.metaKey}>Status</dt>
                <dd className={styles.metaVal}>{status.down ? 'Down' : 'Up'}</dd>
              </div>
              <div className={styles.metaRow}>
                <dt className={styles.metaKey}>Failure mode</dt>
                <dd className={styles.metaVal}>{status.down ? status.mode : '—'}</dd>
              </div>
              <div className={styles.metaRow}>
                <dt className={styles.metaKey}>Queued escalations</dt>
                <dd className={styles.metaVal}>{status.outboxDepth}</dd>
              </div>
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

              <button className={styles.refresh} onClick={load} disabled={pending}>↺ Refresh</button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
