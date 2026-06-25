import type { DecisionTrace } from '@shared/types'
import styles from './TraceTimeline.module.css'

type Props = {
  traces: DecisionTrace[]
}

const confidenceLevel = (score: number): 'confHigh' | 'confMed' | 'confLow' =>
  score >= 0.7 ? 'confHigh' : score >= 0.4 ? 'confMed' : 'confLow'

export const TraceTimeline = ({ traces }: Props): JSX.Element => {
  if (!traces.length) {
    return <div className={`${styles.container} ${styles.emptyText}`}>No traces found</div>
  }

  return (
    <div className={styles.container}>
      {traces.map((trace) => (
        <div key={trace.messageId} className={styles.traceCard}>
          <div className={styles.traceHeader}>
            <span className={`${styles.decisionBadge} ${styles[trace.decision]}`}>
              {trace.decision}
            </span>
            <span className={styles.headerTime}>
              {new Date(trace.timestamp).toLocaleTimeString()} · {trace.latencyMs}ms
            </span>
            {trace.zendeskTicketId && (
              <span className={styles.headerTicket}>
                {trace.zendeskTicketId}
              </span>
            )}
            <span className={styles.headerContext}>
              {trace.customerContext.tier.toUpperCase()} · {trace.customerContext.region.toUpperCase()}
            </span>
          </div>

          <div className={styles.body}>
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Knowledge</div>
              {trace.knowledgeMatches.map((m) => (
                <div key={m.kbMatchId} className={styles.matchRow}>
                  <span className={styles.kbMatch}>
                    {m.kbId}
                    <span className={styles.kbSuffix}>#{m.kbMatchId.split('#')[1] ?? ''}</span>
                  </span>
                  <span className={`${styles.scoreChip} ${styles[confidenceLevel(m.score)]}`}>
                    {(m.score * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.section}>
              <div className={styles.sectionLabel}>Rules</div>
              {trace.rulesEvaluated.filter((r) => r.fired).map((r) => (
                <div key={r.rule} className={styles.ruleRow}>
                  <div className={`${styles.dot} ${styles.dotFired}`} />
                  <span className={`${styles.ruleName} ${styles.ruleNameFired}`}>{r.rule}</span>
                </div>
              ))}
              {trace.rulesEvaluated.filter((r) => !r.fired).map((r) => (
                <div key={r.rule} className={styles.ruleRow}>
                  <div className={`${styles.dot} ${styles.dotInactive}`} />
                  <span className={styles.ruleName}>{r.rule}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
