import { useState } from 'react'
import type { DecisionTrace } from '@shared/types'
import { CustomerSelector } from './CustomerSelector'
import { ChatWindow } from './ChatWindow'
import { TracePanel } from './TracePanel'
import styles from './ChatView.module.css'

// generated once at module load — persists across customer switches within a page session
const SESSION_ID = `session-${Date.now()}`

export const ChatView = (): JSX.Element => {
  const [customerId, setCustomerId] = useState('')
  const [sessionId] = useState(SESSION_ID)
  const [trace, setTrace] = useState<DecisionTrace | null>(null)
  const [traceOpen, setTraceOpen] = useState(true)

  const handleCustomerChange = (id: string) => {
    setCustomerId(id)
    setTrace(null)
  }

  return (
    <div className={styles.view}>
      <CustomerSelector customerId={customerId} onChange={handleCustomerChange} />
      <ChatWindow customerId={customerId} sessionId={sessionId} onTrace={setTrace} />
      <TracePanel trace={trace} isOpen={traceOpen} onToggle={() => setTraceOpen((v) => !v)} />
    </div>
  )
}
