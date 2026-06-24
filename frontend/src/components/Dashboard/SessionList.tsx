import { useEffect, useState } from 'react'
import { fetchSessions, fetchSessionTrace } from '../../api'
import type { DecisionTrace } from '@shared/types'
import { TraceTimeline } from './TraceTimeline'

type Session = {
  sessionId: string
  customerId: string
  traces: DecisionTrace[]
  createdAt: string
  updatedAt: string
}

const DECISION_COLORS: Record<string, string> = {
  answer: '#22c55e',
  escalate: '#ef4444',
  route: '#f97316'
}

const styles: Record<string, React.CSSProperties> = {
  container: { flex: 1, overflowY: 'auto', padding: 24 },
  header: { fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 16 },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: {
    textAlign: 'left' as const,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    color: '#64748b',
    textTransform: 'uppercase' as const,
    padding: '8px 12px',
    borderBottom: '1px solid #2d3148'
  },
  td: {
    padding: '10px 12px',
    fontSize: 13,
    borderBottom: '1px solid #1e2233',
    color: '#e2e8f0'
  },
  row: { cursor: 'pointer', transition: 'background 0.1s' },
  badge: {
    display: 'inline-block',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.06em',
    padding: '2px 8px',
    borderRadius: 99,
    textTransform: 'uppercase' as const
  },
  empty: { textAlign: 'center' as const, color: '#475569', padding: 40, fontSize: 14 },
  refresh: {
    background: '#1e2233',
    border: '1px solid #2d3148',
    borderRadius: 6,
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 12,
    padding: '4px 10px',
    marginLeft: 12
  }
}

export const SessionList = () => {
  const [sessions, setSessions] = useState<Session[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [expandedTraces, setExpandedTraces] = useState<DecisionTrace[]>([])

  const load = () => {
    fetchSessions().then((data) => setSessions(data as Session[]))
  }

  useEffect(() => { load() }, [])

  const handleRowClick = async (sessionId: string) => {
    if (expanded === sessionId) {
      setExpanded(null)
      return
    }
    const data = await fetchSessionTrace(sessionId)
    setExpandedTraces(data.traces)
    setExpanded(sessionId)
  }

  const lastDecision = (s: Session) => s.traces[s.traces.length - 1]?.decision ?? '—'

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <div style={styles.header}>Sessions</div>
        <button style={styles.refresh} onClick={load}>↺ Refresh</button>
      </div>

      {sessions.length === 0 ? (
        <div style={styles.empty}>No sessions yet — start a conversation in the Chat tab</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Session</th>
              <th style={styles.th}>Customer</th>
              <th style={styles.th}>Messages</th>
              <th style={styles.th}>Last Decision</th>
              <th style={styles.th}>Last Active</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => {
              const decision = lastDecision(s)
              const isExpanded = expanded === s.sessionId
              return (
                <>
                  <tr
                    key={s.sessionId}
                    style={{
                      ...styles.row,
                      background: isExpanded ? '#1a1d27' : 'transparent'
                    }}
                    onClick={() => handleRowClick(s.sessionId)}
                  >
                    <td style={styles.td}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6366f1' }}>
                        {s.sessionId.slice(0, 20)}…
                      </span>
                    </td>
                    <td style={styles.td}>{s.customerId}</td>
                    <td style={styles.td}>{s.traces.length}</td>
                    <td style={styles.td}>
                      {decision !== '—' && (
                        <span
                          style={{
                            ...styles.badge,
                            background: DECISION_COLORS[decision] + '22',
                            color: DECISION_COLORS[decision]
                          }}
                        >
                          {decision}
                        </span>
                      )}
                    </td>
                    <td style={{ ...styles.td, color: '#64748b' }}>
                      {new Date(s.updatedAt).toLocaleTimeString()}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${s.sessionId}-trace`}>
                      <td colSpan={5} style={{ padding: '0 0 8px 0', background: '#0f1117' }}>
                        <TraceTimeline traces={expandedTraces} />
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
