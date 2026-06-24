import { useEffect, useState } from 'react'
import type { Customer } from '@shared/types'
import { fetchCustomers } from '../../api'

type Props = {
  customerId: string
  onChange: (id: string) => void
}

const TIER_COLORS: Record<string, string> = {
  consumer: '#6366f1',
  smb: '#0ea5e9',
  enterprise: '#f59e0b',
  vip: '#ec4899'
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    width: 220,
    minWidth: 220,
    background: '#1a1d27',
    borderRight: '1px solid #2d3148',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 12px',
    gap: 12
  },
  label: { fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#64748b', textTransform: 'uppercase' },
  select: {
    width: '100%',
    background: '#0f1117',
    border: '1px solid #2d3148',
    color: '#e2e8f0',
    borderRadius: 6,
    padding: '8px 10px',
    fontSize: 13,
    cursor: 'pointer',
    outline: 'none'
  },
  card: {
    background: '#0f1117',
    border: '1px solid #2d3148',
    borderRadius: 8,
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  name: { fontSize: 14, fontWeight: 600, color: '#f1f5f9' },
  badge: {
    display: 'inline-block',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.06em',
    padding: '2px 7px',
    borderRadius: 99,
    textTransform: 'uppercase'
  },
  meta: { fontSize: 11, color: '#64748b' }
}

export const CustomerSelector = ({ customerId, onChange }: Props) => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const selected = customers.find((c) => c.customerId === customerId)

  // auto-selects the first customer on load so the UI is never in a blank/no-customer state
  useEffect(() => {
    fetchCustomers().then((data) => {
      setCustomers(data)
      if (!customerId && data.length > 0) onChange(data[0].customerId)
    })
  }, [])

  return (
    <div style={styles.panel}>
      <div style={styles.label}>Customer</div>
      <select
        style={styles.select}
        value={customerId}
        onChange={(e) => onChange(e.target.value)}
      >
        {customers.map((c) => (
          <option key={c.customerId} value={c.customerId}>
            {c.name}
          </option>
        ))}
      </select>

      {selected && (
        <div style={styles.card}>
          <div style={styles.name}>{selected.name}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span
              style={{
                ...styles.badge,
                background: TIER_COLORS[selected.tier] + '22',
                color: TIER_COLORS[selected.tier]
              }}
            >
              {selected.tier}
            </span>
            <span
              style={{
                ...styles.badge,
                background: '#334155',
                color: '#94a3b8'
              }}
            >
              {selected.region.toUpperCase()}
            </span>
          </div>
          <div style={styles.meta}>ID: {selected.customerId}</div>
          <div style={styles.meta}>Purchased: {selected.purchaseDate}</div>
          <div style={{ ...styles.meta, marginTop: 4 }}>
            {selected.products.map((p) => (
              <div key={p} style={{ marginBottom: 2 }}>
                • {p}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
