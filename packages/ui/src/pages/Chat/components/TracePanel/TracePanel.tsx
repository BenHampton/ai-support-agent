import type { DecisionTrace } from '@shared/types'
import { AppBadge } from '@components/AppBadge/AppBadge'
import styles from './TracePanel.module.css'

type Props = {
  trace: DecisionTrace | null
  isOpen: boolean
  onToggle: () => void
}

const confidenceLevel = (score: number): 'confHigh' | 'confMed' | 'confLow' =>
  score >= 0.7 ? 'confHigh' : score >= 0.4 ? 'confMed' : 'confLow'

// surface a rule's computed refund verdict as a structured chip, not just buried in the reason prose
const eligibleVerdict = (metadata?: Record<string, unknown>): 'ELIGIBLE' | 'NOT ELIGIBLE' | null =>
  typeof metadata?.eligible === 'boolean' ? (metadata.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE') : null

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
                <AppBadge tone={trace.decision} size="lg" shape="rounded">
                  <span>{trace.decision === 'escalate' ? '⚡' : trace.decision === 'route' ? '→' : '✓'}</span>
                  <span>{trace.decision}</span>
                </AppBadge>
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
                {trace.rulesEvaluated.map((r) => {
                  const verdict = eligibleVerdict(r.metadata)
                  return (
                    <div key={r.rule} className={styles.ruleRow}>
                      <div className={`${styles.ruleDot} ${r.fired ? styles.dotFired : styles.dotInactive}`} />
                      <div className={styles.ruleBody}>
                        <div className={styles.ruleName}>{r.rule}</div>
                        <div className={styles.ruleReason}>{r.reason}</div>
                        {verdict && (
                          <AppBadge
                            tone={verdict === 'ELIGIBLE' ? 'answer' : 'escalate'}
                            size="sm"
                            className={styles.verdictPos}
                          >
                            {verdict}
                          </AppBadge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
