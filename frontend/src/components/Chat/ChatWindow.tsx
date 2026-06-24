import { useEffect, useRef, useState } from 'react'
import type { DecisionTrace, ZendeskTicket } from '@shared/types'
import { streamChat } from '../../api'
import { EscalationCard } from './EscalationCard'

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

// bubble background tints by pipeline outcome: green=answer, red=escalate, orange=route
const DECISION_BG: Record<string, string> = {
  answer: '#0d1f14',
  escalate: '#1a0a0a',
  route: '#1a100a'
}

const styles: Record<string, React.CSSProperties> = {
  container: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  messages: { flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 },
  userBubble: {
    alignSelf: 'flex-end',
    background: '#1e3a5f',
    border: '1px solid #1d4ed8',
    borderRadius: '12px 12px 2px 12px',
    padding: '10px 14px',
    maxWidth: '70%',
    fontSize: 14,
    lineHeight: 1.5,
    color: '#bfdbfe'
  },
  aiBubble: {
    alignSelf: 'flex-start',
    background: '#1a1d27',
    border: '1px solid #2d3148',
    borderRadius: '12px 12px 12px 2px',
    padding: '10px 14px',
    maxWidth: '75%',
    fontSize: 14,
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap' as const
  },
  cursor: {
    display: 'inline-block',
    width: 8,
    height: 14,
    background: '#6366f1',
    borderRadius: 2,
    animation: 'blink 0.8s infinite',
    verticalAlign: 'text-bottom',
    marginLeft: 2
  },
  inputRow: {
    display: 'flex',
    gap: 8,
    padding: '12px 16px',
    borderTop: '1px solid #2d3148',
    background: '#1a1d27'
  },
  input: {
    flex: 1,
    background: '#0f1117',
    border: '1px solid #2d3148',
    borderRadius: 8,
    color: '#e2e8f0',
    fontSize: 14,
    padding: '10px 14px',
    outline: 'none',
    resize: 'none' as const,
    fontFamily: 'inherit'
  },
  sendBtn: {
    background: '#4f46e5',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    padding: '0 18px',
    transition: 'background 0.15s'
  },
  empty: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 14 }
}

// module-level so IDs are stable across re-renders without triggering state updates
let msgCounter = 0
const nextId = () => `m${++msgCounter}`

export const ChatWindow = ({ customerId, sessionId, onTrace }: Props) => {
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
    <div style={styles.container}>
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>

      {messages.length === 0 ? (
        <div style={styles.empty}>Select a customer and start a conversation</div>
      ) : (
        <div style={styles.messages}>
          {messages.map((msg) => {
            if (msg.role === 'user') {
              return <div key={msg.id} style={styles.userBubble}>{msg.content}</div>
            }
            const bg = msg.trace ? DECISION_BG[msg.trace.decision] : '#1a1d27'
            return (
              <div key={msg.id}>
                <div style={{ ...styles.aiBubble, background: bg }}>
                  {msg.content}
                  {msg.isStreaming && <span style={styles.cursor} />}
                </div>
                {msg.ticket && <EscalationCard ticket={msg.ticket} />}
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      )}

      <div style={styles.inputRow}>
        <textarea
          style={styles.input}
          rows={2}
          placeholder="Ask a support question… (Enter to send, Shift+Enter for newline)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          disabled={loading || !customerId}
        />
        <button style={styles.sendBtn} onClick={send} disabled={loading || !customerId}>
          {loading ? '…' : 'Send'}
        </button>
      </div>
    </div>
  )
}
