import type { DecisionTrace } from '@shared/types'
import styles from './TracePanel.module.css'

type Props = {
  trace: DecisionTrace | null
  isOpen: boolean
  onToggle: () => void
}

const confidenceLevel = (score: number): 'confHigh' | 'confMed' | 'confLow' =>
  score >= 0.7 ? 'confHigh' : score >= 0.4 ? 'confMed' : 'confLow'

export const TracePanel = ({ trace, isOpen, onToggle }: Props): JSX.Element => {
  return (
    <div className={`${styles.panel} ${isOpen ? '' : styles.panelCollapsed}`}>
      <button
        type="button"
        className={styles.header}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label="Toggle decision trace"
      >
        {isOpen ? (
          <>
            <span className={styles.headerTitle}>Trace</span>
            <span className={styles.chevron}>›</span>
          </>
        ) : (
          <span className={styles.chevronCollapsed}>‹</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.body}>
          {!trace ? (
            <div className={styles.placeholder}>
              Send a message to see the decision trace
            </div>
          ) : (
            <>
              <div className={styles.section}>
                <div className={styles.sectionLabel}>Decision</div>
                <span className={`${styles.decisionBadge} ${styles[trace.decision]}`}>
                  {trace.decision === 'escalate' ? '⚡' : trace.decision === 'route' ? '→' : '✓'} {trace.decision}
                </span>
                <div className={styles.meta}>{trace.latencyMs}ms · {new Date(trace.timestamp).toLocaleTimeString()}</div>
                {trace.zendeskTicketId && (
                  <div className={`${styles.meta} ${styles.metaTicket}`}>Ticket: {trace.zendeskTicketId}</div>
                )}
              </div>

              <div className={styles.section}>
                <div className={styles.sectionLabel}>Knowledge ({trace.knowledgeMatches.length})</div>
                {trace.knowledgeMatches.map((m) => (
                  <div key={m.kbMatchId} className={`${styles.matchRow} ${styles[confidenceLevel(m.score)]}`}>
                    <div className={styles.matchHead}>
                      <span className={styles.matchId}>
                        {m.kbId}
                        <span className={styles.kbSuffix}>#{m.kbMatchId.split('#')[1] ?? ''}</span>
                      </span>
                      <span className={styles.scorePct}>
                        {(m.score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className={styles.scoreBar}>
                      <div className={styles.barFill} style={{ width: `${m.score * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.section}>
                <div className={styles.sectionLabel}>Rules</div>
                {trace.rulesEvaluated.map((r) => (
                  <div key={r.rule} className={styles.ruleRow}>
                    <div className={`${styles.ruleDot} ${r.fired ? styles.dotFired : styles.dotInactive}`} />
                    <div className={styles.ruleBody}>
                      <div className={styles.ruleName}>{r.rule}</div>
                      <div className={styles.ruleReason}>{r.reason}</div>
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
