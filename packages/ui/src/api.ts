import type { DecisionTrace, Customer, ZendeskTicket } from '@shared/types'

export type SseToken = { type: 'token'; content: string }
export type SseDone = { type: 'done'; reply: string; trace: DecisionTrace; ticket?: ZendeskTicket }
export type SseError = { type: 'error'; message: string }
export type SseEvent = SseToken | SseDone | SseError

export const fetchCustomers = async (): Promise<Customer[]> => {
  const res = await fetch('/api/customers')
  const json = await res.json() as { data: Customer[] }
  return json.data
}

export const streamChat = async (
  params: { sessionId: string; customerId: string; message: string },
  onEvent: (event: SseEvent) => void
): Promise<void> => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  })

  if (!response.body) throw new Error('No response body')

  // SSE frames are delimited by \n\n per spec; buffer accumulates split TCP chunks before parsing
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''
    for (const part of parts) {
      const line = part.replace(/^data: /, '').trim()
      if (!line) continue
      try {
        onEvent(JSON.parse(line) as SseEvent)
      } catch {
        // skip malformed
      }
    }
  }
}

export const fetchTickets = async (): Promise<ZendeskTicket[]> => {
  const res = await fetch('/api/tickets')
  const tickets = (await res.json() as { data: ZendeskTicket[] }).data
  // newest-first for the list view
  return tickets.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export type ZendeskFailureMode = 'timeout' | '503' | 'hang'
export type ZendeskAdminStatus = { down: boolean; mode: ZendeskFailureMode; queueDepth: number; deadLetterDepth: number }

export const fetchZendeskStatus = async (): Promise<ZendeskAdminStatus> => {
  const res = await fetch('/api/admin/zendesk/status')
  return (await res.json() as { data: ZendeskAdminStatus }).data
}

export const setZendeskDown = async (
  down: boolean,
  mode?: ZendeskFailureMode
): Promise<{ down: boolean; mode: ZendeskFailureMode }> => {
  const res = await fetch('/api/admin/zendesk/down', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ down, mode })
  })
  return (await res.json() as { data: { down: boolean; mode: ZendeskFailureMode } }).data
}

// operator redrive: move all dead-lettered escalations back onto the queue for another delivery attempt
export const replayDeadLetters = async (): Promise<{ replayed: number }> => {
  const res = await fetch('/api/admin/zendesk/dead-letters/replay', { method: 'POST' })
  return (await res.json() as { data: { replayed: number } }).data
}

export const fetchSessions = async () => {
  const res = await fetch('/api/sessions')
  return (await res.json() as { data: unknown[] }).data
}

export const fetchSessionTrace = async (sessionId: string) => {
  const res = await fetch(`/api/sessions/${sessionId}/trace`)
  return (await res.json() as { data: { sessionId: string; traces: DecisionTrace[] } }).data
}
