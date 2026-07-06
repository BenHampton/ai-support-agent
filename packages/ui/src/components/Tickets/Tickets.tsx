import { Fragment, useEffect, useState } from 'react'
import type { ZendeskTicket } from '@shared/types'
import { fetchTickets } from '../../api'
import styles from './Tickets.module.css'

export const Tickets = (): JSX.Element => {
  const [tickets, setTickets] = useState<ZendeskTicket[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = () => {
    fetchTickets().then(setTickets)
  }

  // load once on mount; load() is also wired to the Refresh button
  useEffect(() => {
    fetchTickets().then(setTickets)
  }, [])

  const toggle = (id: string) => setExpanded((current) => (current === id ? null : id))

  const onRowKey = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle(id)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.header}>Zendesk Tickets</div>
        <button className={styles.refresh} onClick={load}>↺ Refresh</button>
      </div>

      {tickets.length === 0 ? (
        <div className={styles.empty}>No tickets yet — escalate a conversation in the Chat tab</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Ticket</th>
              <th className={styles.th}>Priority</th>
              <th className={styles.th}>Customer</th>
              <th className={styles.th}>Reason</th>
              <th className={styles.th}>Created</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => {
              const isExpanded = expanded === t.id
              return (
                <Fragment key={t.id}>
                  <tr
                    className={`${styles.row} ${isExpanded ? styles.rowExpanded : ''}`}
                    onClick={() => toggle(t.id)}
                    onKeyDown={(e) => onRowKey(e, t.id)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                  >
                    <td className={styles.td}>
                      <span className={styles.ticketId}>{t.id}</span>
                    </td>
                    <td className={styles.td}>
                      <span className={`${styles.badge} ${styles[t.priority]}`}>{t.priority}</span>
                    </td>
                    <td className={styles.td}>{t.customerId}</td>
                    <td className={styles.td}>{t.reason}</td>
                    <td className={`${styles.td} ${styles.muted}`}>
                      {new Date(t.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={5} className={styles.detailCell}>
                        <div className={styles.detailLabel}>Conversation context (sanitized)</div>
                        <div className={styles.detailContext}>{t.conversationContext}</div>
                        <div className={styles.detailMeta}>Session: {t.sessionId}</div>
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
