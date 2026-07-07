import { useEffect, useRef, useState } from 'react'
import type { DecisionTrace, ZendeskTicket } from '@shared/types'
import { streamChat } from '../../../../api'
import { EscalationCard } from '../EscalationCard/EscalationCard'
import { AppButton } from '@components/AppButton/AppButton'
import styles from './ChatWindow.module.css'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  trace?: DecisionTrace
  ticket?: ZendeskTicket
  isStreaming?: boolean
}

type Props = {
  customerId: string
  sessionId: string
  onTrace: (trace: DecisionTrace) => void
}

// module-level so IDs are stable across re-renders without triggering state updates
let msgCounter = 0
const nextId = () => `m${++msgCounter}`

export const ChatWindow = ({ customerId, sessionId, onTrace }: Props): JSX.Element => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages([])
  }, [customerId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || loading || !customerId) return

    setInput('')
    setLoading(true)

    const userMsg: ChatMessage = { id: nextId(), role: 'user', content: text }
    const aiId = nextId()
    const aiMsg: ChatMessage = { id: aiId, role: 'assistant', content: '', isStreaming: true }

    setMessages((prev) => [...prev, userMsg, aiMsg])

    try {
      await streamChat({ sessionId, customerId, message: text }, (event) => {
        if (event.type === 'token') {
          setMessages((prev) =>
            prev.map((m) => (m.id === aiId ? { ...m, content: m.content + event.content } : m))
          )
        } else if (event.type === 'done') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiId
                ? { ...m, content: event.reply, isStreaming: false, trace: event.trace, ticket: event.ticket }
                : m
            )
          )
          onTrace(event.trace)
        } else if (event.type === 'error') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiId ? { ...m, content: `Error: ${event.message}`, isStreaming: false } : m
            )
          )
        }
      })
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Request failed'
      setMessages((prev) =>
        prev.map((m) => (m.id === aiId ? { ...m, content: `Error: ${errMsg}`, isStreaming: false } : m))
      )
    } finally {
      setLoading(false)
    }
  }

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className={styles.container}>
      {messages.length === 0 ? (
        <div className={styles.empty}>Select a customer and start a conversation</div>
      ) : (
        <div className={styles.messages}>
          {messages.map((msg) => {
            if (msg.role === 'user') {
              return <div key={msg.id} className={styles.userBubble}>{msg.content}</div>
            }
            return (
              <div key={msg.id}>
                <div className={`${styles.aiBubble} ${msg.trace ? styles[msg.trace.decision] : ''}`}>
                  {msg.content}
                  {msg.isStreaming && <span className={styles.cursor} />}
                </div>
                {msg.ticket && <EscalationCard ticket={msg.ticket} />}
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      )}

      <div className={styles.inputRow}>
        <textarea
          className={styles.input}
          rows={2}
          placeholder="Ask a support question… (Enter to send, Shift+Enter for newline)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          disabled={loading || !customerId}
        />
        <AppButton variant="primary" onClick={send} disabled={loading || !customerId} className={styles.sendBtn}>
          {loading ? '…' : 'Send'}
        </AppButton>
      </div>
    </div>
  )
}
