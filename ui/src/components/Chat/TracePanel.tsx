import type { DecisionTrace } from '@shared/types'

type Props = {
  trace: DecisionTrace | null
  isOpen: boolean
  onToggle: () => void
}

const DECISION_COLORS: Record<string, string> = {
  answer: '#22c55e',
  escalate: '#ef4444',
  route: '#f97316'
}

// ≥0.7 high confidence, ≥0.4 marginal (lowConfidenceRule threshold), <0.4 will escalate
const confidenceColor = (score: number): string => {
  if (score >= 0.7) return '#22c55e'
  if (score >= 0.4) return '#eab308'
  return '#ef4444'
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    width: 280,
    minWidth: 280,
    background: '#1a1d27',
    borderLeft: '1px solid #2d3148',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 14px',
    borderBottom: '1px solid #2d3148',
    cursor: 'pointer',
    userSelect: 'none' as const
  },
  headerTitle: { fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', color: '#64748b', textTransform: 'uppercase' },
  body: { flex: 1, overflowY: 'auto' as const, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 16 },
  section: { display: 'flex', flexDirection: 'column', gap: 8 },
  sectionLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#475569', textTransform: 'uppercase' },
  decisionBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em'
  },
  matchRow: {
    background: '#0f1117',
    border: '1px solid #2d3148',
    borderRadius: 6,
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  matchId: { fontSize: 11, fontFamily: 'monospace', color: '#94a3b8' },
  scoreBar: { height: 4, borderRadius: 2, background: '#2d3148' },
  ruleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11,
    padding: '4px 0'
  },
  ruleDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  ruleName: { fontFamily: 'monospace', color: '#94a3b8', flex: 1 },
  ruleReason: { fontSize: 10, color: '#475569' },
  meta: { fontSize: 11, color: '#64748b' }
}

export const TracePanel = ({ trace, isOpen, onToggle }: Props) => {
  return (
    <div style={{ ...styles.panel, width: isOpen ? 280 : 42, minWidth: isOpen ? 280 : 42, transition: 'width 0.2s, min-width 0.2s' }}>
      <div style={styles.header} onClick={onToggle}>
        {isOpen ? (
          <>
            <span style={styles.headerTitle}>Trace</span>
            <span style={{ color: '#475569', fontSize: 14 }}>›</span>
          </>
        ) : (
          <span style={{ color: '#475569', fontSize: 14, margin: 'auto' }}>‹</span>
        )}
      </div>

      {isOpen && (
        <div style={styles.body}>
          {!trace ? (
            <div style={{ color: '#475569', fontSize: 12, textAlign: 'center', marginTop: 24 }}>
              Send a message to see the decision trace
            </div>
          ) : (
            <>
              <div style={styles.section}>
                <div style={styles.sectionLabel}>Decision</div>
                <span
                  style={{
                    ...styles.decisionBadge,
                    background: DECISION_COLORS[trace.decision] + '22',
                    color: DECISION_COLORS[trace.decision]
                  }}
                >
                  {trace.decision === 'escalate' ? '⚡' : trace.decision === 'route' ? '→' : '✓'} {trace.decision}
                </span>
                <div style={styles.meta}>{trace.latencyMs}ms · {new Date(trace.timestamp).toLocaleTimeString()}</div>
                {trace.zendeskTicketId && (
                  <div style={{ ...styles.meta, color: '#f87171' }}>Ticket: {trace.zendeskTicketId}</div>
                )}
              </div>

              <div style={styles.section}>
                <div style={styles.sectionLabel}>Knowledge ({trace.knowledgeMatches.length})</div>
                {trace.knowledgeMatches.map((m) => (
                  <div key={m.kbMatchId} style={styles.matchRow}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={styles.matchId}>
                        {m.kbId}
                        <span style={{ opacity: 0.5 }}>#{m.kbMatchId.split('#')[1] ?? ''}</span>
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: confidenceColor(m.score) }}>
                        {(m.score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div style={styles.scoreBar}>
                      <div
                        style={{
                          height: '100%',
                          width: `${m.score * 100}%`,
                          background: confidenceColor(m.score),
                          borderRadius: 2,
                          transition: 'width 0.3s'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div style={styles.section}>
                <div style={styles.sectionLabel}>Rules</div>
                {trace.rulesEvaluated.map((r) => (
                  <div key={r.rule} style={styles.ruleRow}>
                    <div
                      style={{
                        ...styles.ruleDot,
                        background: r.fired ? '#22c55e' : '#334155'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={styles.ruleName}>{r.rule}</div>
                      <div style={styles.ruleReason}>{r.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
