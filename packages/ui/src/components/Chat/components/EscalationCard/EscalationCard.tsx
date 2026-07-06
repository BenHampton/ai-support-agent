import type { ZendeskTicket } from '@shared/types'
import styles from './EscalationCard.module.css'

type Props = {
  ticket: ZendeskTicket
}

export const EscalationCard = ({ ticket }: Props): JSX.Element => (
  <div className={styles.card}>
    <div className={styles.header}>
      <span className={styles.icon}>⚡</span>
      <span className={styles.title}>Escalated to Support Team</span>
    </div>
    <div className={styles.row}>
      <span className={styles.label}>Ticket</span>
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
  </div>
)
