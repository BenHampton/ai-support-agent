import { useEffect, useState } from 'react'
import type { Customer } from '@shared/types'
import { fetchCustomers } from '../../api'
import styles from './CustomerSelector.module.css'

type Props = {
  customerId: string
  onChange: (id: string) => void
}

export const CustomerSelector = ({ customerId, onChange }: Props): JSX.Element => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const selected = customers.find((c) => c.customerId === customerId)

  // run-once loader on mount: fetch customers and auto-select the first so the UI is
  // never in a blank/no-customer state. Intentionally mount-only — re-running on
  // customerId/onChange identity changes would refetch on every parent render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchCustomers().then((data) => {
      setCustomers(data)
      if (!customerId && data.length > 0) onChange(data[0].customerId)
    })
  }, [])

  return (
    <div className={styles.panel}>
      <label htmlFor="customer-select" className={styles.label}>Customer</label>
      <select
        id="customer-select"
        className={styles.select}
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
        <div className={styles.card}>
          <div className={styles.name}>{selected.name}</div>
          <div className={styles.badges}>
            <span className={`${styles.badge} ${styles[selected.tier]}`}>
              {selected.tier}
            </span>
            <span className={`${styles.badge} ${styles.regionBadge}`}>
              {selected.region.toUpperCase()}
            </span>
          </div>
          <div className={styles.meta}>ID: {selected.customerId}</div>
          <div className={styles.meta}>Purchased: {selected.purchaseDate}</div>
          <div className={`${styles.meta} ${styles.metaProducts}`}>
            {selected.products.map((p) => (
              <div key={p} className={styles.productLine}>
                • {p}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
