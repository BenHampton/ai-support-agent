import type { ZendeskTicket } from '@shared/types'

type Props = {
  ticket: ZendeskTicket
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#ef4444',
  high: '#f97316',
  normal: '#6366f1',
  low: '#64748b'
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: '#1a0a0a',
    border: '1px solid #7f1d1d',
    borderLeft: '4px solid #ef4444',
    borderRadius: 8,
    padding: '12px 14px',
    margin: '8px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  header: { display: 'flex', alignItems: 'center', gap: 8 },
  icon: { fontSize: 16 },
  title: { fontSize: 13, fontWeight: 700, color: '#fca5a5' },
  row: { display: 'flex', gap: 8, fontSize: 12 },
  label: { color: '#64748b', minWidth: 60 },
  value: { color: '#e2e8f0', fontFamily: 'monospace' },
  badge: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.06em',
    padding: '2px 7px',
    borderRadius: 99,
    textTransform: 'uppercase' as const
  }
}

export const EscalationCard = ({ ticket }: Props) => (
  <div style={styles.card}>
    <div style={styles.header}>
      <span style={styles.icon}>⚡</span>
      <span style={styles.title}>Escalated to Support Team</span>
    </div>
    <div style={styles.row}>
      <span style={styles.label}>Ticket</span>
      <span style={{ ...styles.value, color: '#f87171' }}>{ticket.id}</span>
    </div>
    <div style={styles.row}>
      <span style={styles.label}>Priority</span>
      <span
        style={{
          ...styles.badge,
          background: PRIORITY_COLORS[ticket.priority] + '22',
          color: PRIORITY_COLORS[ticket.priority]
        }}
      >
        {ticket.priority}
      </span>
    </div>
    <div style={styles.row}>
      <span style={styles.label}>Created</span>
      <span style={styles.value}>{new Date(ticket.createdAt).toLocaleTimeString()}</span>
    </div>
  </div>
)
