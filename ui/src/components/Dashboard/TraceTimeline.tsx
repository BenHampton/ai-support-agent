import type { DecisionTrace } from '@shared/types'

type Props = {
  traces: DecisionTrace[]
}

const DECISION_COLORS: Record<string, string> = {
  answer: '#22c55e',
  escalate: '#ef4444',
  route: '#f97316'
}

const confidenceColor = (score: number): string => {
  if (score >= 0.7) return '#22c55e'
  if (score >= 0.4) return '#eab308'
  return '#ef4444'
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '12px 24px', display: 'flex', flexDirection: 'column', gap: 12 },
  traceCard: {
    background: '#1a1d27',
    border: '1px solid #2d3148',
    borderRadius: 8,
    overflow: 'hidden'
  },
  traceHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 14px',
    background: '#151824'
  },
  decisionBadge: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.08em',
    padding: '3px 8px',
    borderRadius: 99,
    textTransform: 'uppercase' as const
  },
  body: { padding: '12px 14px', display: 'flex', gap: 16, flexWrap: 'wrap' as const },
  section: { flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 6 },
  sectionLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#475569', textTransform: 'uppercase' as const, marginBottom: 4 },
  matchRow: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8' },
  scoreChip: { fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99 },
  ruleRow: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 },
  dot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  ruleName: { fontFamily: 'monospace', color: '#94a3b8', flex: 1 },
  meta: { fontSize: 11, color: '#64748b' }
}

export const TraceTimeline = ({ traces }: Props) => {
  if (!traces.length) {
    return <div style={{ ...styles.container, color: '#475569', fontSize: 13 }}>No traces found</div>
  }

  return (
    <div style={styles.container}>
      {traces.map((trace) => (
        <div key={trace.messageId} style={styles.traceCard}>
          <div style={styles.traceHeader}>
            <span
              style={{
                ...styles.decisionBadge,
                background: DECISION_COLORS[trace.decision] + '22',
                color: DECISION_COLORS[trace.decision]
              }}
            >
              {trace.decision}
            </span>
            <span style={{ fontSize: 11, color: '#64748b' }}>
              {new Date(trace.timestamp).toLocaleTimeString()} · {trace.latencyMs}ms
            </span>
            {trace.zendeskTicketId && (
              <span style={{ fontSize: 11, color: '#f87171', fontFamily: 'monospace' }}>
                {trace.zendeskTicketId}
              </span>
            )}
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#475569' }}>
              {trace.customerContext.tier.toUpperCase()} · {trace.customerContext.region.toUpperCase()}
            </span>
          </div>

          <div style={styles.body}>
            <div style={styles.section}>
              <div style={styles.sectionLabel}>Knowledge</div>
              {trace.knowledgeMatches.map((m) => (
                <div key={m.kbMatchId} style={styles.matchRow}>
                  <span style={{ fontFamily: 'monospace' }}>
                    {m.kbId}
                    <span style={{ opacity: 0.5 }}>#{m.kbMatchId.split('#')[1] ?? ''}</span>
                  </span>
                  <span
                    style={{
                      ...styles.scoreChip,
                      background: confidenceColor(m.score) + '22',
                      color: confidenceColor(m.score)
                    }}
                  >
                    {(m.score * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>

            <div style={styles.section}>
              <div style={styles.sectionLabel}>Rules</div>
              {trace.rulesEvaluated.filter((r) => r.fired).map((r) => (
                <div key={r.rule} style={styles.ruleRow}>
                  <div style={{ ...styles.dot, background: '#22c55e' }} />
                  <span style={{ ...styles.ruleName, color: '#22c55e' }}>{r.rule}</span>
                </div>
              ))}
              {trace.rulesEvaluated.filter((r) => !r.fired).map((r) => (
                <div key={r.rule} style={styles.ruleRow}>
                  <div style={{ ...styles.dot, background: '#334155' }} />
                  <span style={styles.ruleName}>{r.rule}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
