import { useEffect, useState, type ReactNode } from 'react'
import { fetchZendeskStatus, setZendeskDown, replayDeadLetters, type ZendeskAdminStatus, type ZendeskFailureMode } from '../../api'
import { AppSelectOptions } from '@components/AppSelectOptions/AppSelectOptions'
import { AppBadge } from '@components/AppBadge/AppBadge'
import { AppButton } from '@components/AppButton/AppButton'
import { AppTooltip } from '@components/AppTooltip/AppTooltip'
import { AppAlert } from '@components/AppAlert/AppAlert'
import styles from './Admin.module.css'

// how the simulated Zendesk outage fails — mirrors the backend ZendeskFailureMode
const FAILURE_MODES: ZendeskFailureMode[] = ['timeout', '503', 'hang']

export const Admin = (): JSX.Element => {
  const [status, setStatus] = useState<ZendeskAdminStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // separate busy flags so each button shows its own busy label — clicking the toggle must not rewrite the
  // Replay button's text (and vice versa). `busy` still disables everything during any in-flight mutation.
  const [toggling, setToggling] = useState(false)
  const [replaying, setReplaying] = useState(false)
  const busy = toggling || replaying
  const [mode, setMode] = useState<ZendeskFailureMode>('timeout')

  // background refresh (toggle / replay / Refresh button) — deliberately does NOT touch `loading`, so the
  // stats + controls stay mounted and update in place instead of unmounting into the "Loading…" state and
  // flickering. The full-screen loading state is only for the initial mount (below).
  const load = () => {
    setError(null)
    fetchZendeskStatus()
      .then((s) => {
        setStatus(s)
        setMode(s.mode)
      })
      .catch(() => setError('Could not load Zendesk status — is the API running?'))
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
    setToggling(true)
    setError(null)
    setZendeskDown(!status.down, mode)
      .then(() => load())
      .catch(() => setError('Could not update Zendesk status'))
      .finally(() => setToggling(false))
  }

  const onReplay = () => {
    setReplaying(true)
    setError(null)
    replayDeadLetters()
      .then(() => load())
      .catch(() => setError('Could not replay dead-letters'))
      .finally(() => setReplaying(false))
  }

  const tiles: { label: string; value: ReactNode; danger?: boolean }[] = status
    ? [
        { label: 'Status', value: status.down ? 'Down' : 'Up' },
        {
          // the failure-mode picker lives inside its own tile; disabled while an outage is active or a
          // request is in flight (you can't change how it fails mid-outage)
          label: 'Failure mode',
          value: (
            <AppSelectOptions
              value={mode}
              onChange={(v) => setMode(v as ZendeskFailureMode)}
              options={FAILURE_MODES.map((m) => ({ value: m, label: m.charAt(0).toUpperCase() + m.slice(1) }))}
              disabled={status.down || busy}
              fullWidth
              ariaLabel="Zendesk failure mode"
            />
          )
        },
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
          <AppBadge tone={status.down ? 'escalate' : 'answer'}>
            {status.down ? 'Outage (simulated)' : 'Operational'}
          </AppBadge>
        )}
      </div>

      {loading && <div className={styles.muted}>Loading status…</div>}
      {error && <AppAlert severity="error" className={styles.errorAlert}>{error}</AppAlert>}

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
            <AppButton
              variant={status.down ? 'answer' : 'escalate'}
              onClick={onToggle}
              disabled={busy}
              className={styles.actionBtn}
            >
              {toggling ? 'Updating…' : status.down ? 'Restore Zendesk' : 'Simulate outage'}
            </AppButton>

            <AppTooltip title={status.deadLetterDepth === 0 ? 'No dead-lettered escalations to replay' : ''}>
              <AppButton
                variant="route"
                onClick={onReplay}
                disabled={busy || status.deadLetterDepth === 0}
                className={styles.replayBtn}
              >
                {replaying
                  ? 'Working…'
                  : status.deadLetterDepth > 0
                    ? `Replay ${status.deadLetterDepth} dead-letter${status.deadLetterDepth === 1 ? '' : 's'}`
                    : 'Replay dead-letters'}
              </AppButton>
            </AppTooltip>

            <AppButton variant="subtle" onClick={load}>↺ Refresh</AppButton>
          </div>
        </>
      )}
    </div>
  )
}
