import type { ZendeskTicket } from '@shared/types'
import styles from './EscalationCard.module.css'

type Props = {
  ticket: ZendeskTicket
}

export const EscalationCard = ({ ticket }: Props): JSX.Element => {
  // Escalations are delivered asynchronously: the queue returns a provisional PENDING- reference and the
  // consumer creates the real ZD- ticket shortly after (visible in the Dashboard trace). Reflect that
  // provisional state here rather than showing a raw PENDING- id under a "Ticket" label.
  const isPending = ticket.id.startsWith('PENDING-')

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.icon}>⚡</span>
        <span className={styles.title}>Escalated to Support Team</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>{isPending ? 'Reference' : 'Ticket'}</span>
        <span className={`${styles.value} ${styles.valueTicket}`}>{ticket.id}</span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Priority</span>
        <span className={`${styles.badge} ${styles[ticket.priority]}`}>
          {ticket.priority}
        </span>
      </div>
      <div className={styles.row}>
        <span className={styles.label}>Created</span>
        <span className={styles.value}>{new Date(ticket.createdAt).toLocaleTimeString()}</span>
      </div>
      {isPending && <div className={styles.note}>Ticket is being created…</div>}
    </div>
  )
}
