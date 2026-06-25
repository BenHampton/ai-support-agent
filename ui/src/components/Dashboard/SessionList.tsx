import { Fragment, useEffect, useState } from 'react'
import { fetchSessions, fetchSessionTrace } from '../../api'
import type { DecisionTrace, Decision } from '@shared/types'
import { TraceTimeline } from './TraceTimeline'
import styles from './SessionList.module.css'

type Session = {
  sessionId: string
  customerId: string
  traces: DecisionTrace[]
  createdAt: string
  updatedAt: string
}

export const SessionList = (): JSX.Element => {
  const [sessions, setSessions] = useState<Session[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [expandedTraces, setExpandedTraces] = useState<DecisionTrace[]>([])

  const load = () => {
    fetchSessions().then((data) => setSessions(data as Session[]))
  }

  // load once on mount; load() is also wired to the Refresh button
  useEffect(() => {
    fetchSessions().then((data) => setSessions(data as Session[]))
  }, [])

  const handleRowClick = async (sessionId: string) => {
    if (expanded === sessionId) {
      setExpanded(null)
      return
    }
    const data = await fetchSessionTrace(sessionId)
    setExpandedTraces(data.traces)
    setExpanded(sessionId)
  }

  const onRowKey = (e: React.KeyboardEvent, sessionId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleRowClick(sessionId)
    }
  }

  const lastDecision = (s: Session): Decision | '—' => s.traces[s.traces.length - 1]?.decision ?? '—'

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.header}>Sessions</div>
        <button className={styles.refresh} onClick={load}>↺ Refresh</button>
      </div>

      {sessions.length === 0 ? (
        <div className={styles.empty}>No sessions yet — start a conversation in the Chat tab</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Session</th>
              <th className={styles.th}>Customer</th>
              <th className={styles.th}>Messages</th>
              <th className={styles.th}>Last Decision</th>
              <th className={styles.th}>Last Active</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => {
              const decision = lastDecision(s)
              const isExpanded = expanded === s.sessionId
              return (
                <Fragment key={s.sessionId}>
                  <tr
                    className={`${styles.row} ${isExpanded ? styles.rowExpanded : ''}`}
                    onClick={() => handleRowClick(s.sessionId)}
                    onKeyDown={(e) => onRowKey(e, s.sessionId)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                  >
                    <td className={styles.td}>
                      <span className={styles.sessionId}>
                        {s.sessionId.slice(0, 20)}…
                      </span>
                    </td>
                    <td className={styles.td}>{s.customerId}</td>
                    <td className={styles.td}>{s.traces.length}</td>
                    <td className={styles.td}>
                      {decision !== '—' && (
                        <span className={`${styles.badge} ${styles[decision]}`}>
                          {decision}
                        </span>
                      )}
                    </td>
                    <td className={`${styles.td} ${styles.muted}`}>
                      {new Date(s.updatedAt).toLocaleTimeString()}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={5} className={styles.traceCell}>
                        <TraceTimeline traces={expandedTraces} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
