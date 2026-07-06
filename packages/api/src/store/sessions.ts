import type { Message, DecisionTrace } from '@shared/types'

type Session = {
  sessionId: string
  customerId: string
  messages: Message[]
  traces: DecisionTrace[]
  createdAt: string
  updatedAt: string
}

// in-memory only — lost on restart; intentional for this prototype
const sessionMap = new Map<string, Session>()

export const getOrCreateSession = (sessionId: string, customerId: string): Session => {
  if (!sessionMap.has(sessionId)) {
    sessionMap.set(sessionId, {
      sessionId,
      customerId,
      messages: [],
      traces: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }
  return sessionMap.get(sessionId)!
}

// one chat turn = the messages it produced (user + assistant) plus a single DecisionTrace. The trace is
// per-request, so it is stored once here — not once per message — to avoid duplicate trace cards.
export const appendTurn = (sessionId: string, messages: Message[], trace: DecisionTrace): void => {
  const session = sessionMap.get(sessionId)
  if (!session) return
  session.messages.push(...messages)
  session.traces.push(trace)
  session.updatedAt = new Date().toISOString()
}

// strips messages to avoid sending full conversation payloads in the list endpoint
export const listSessions = (): Omit<Session, 'messages'>[] =>
  [...sessionMap.values()].map(({ messages: _m, ...rest }) => rest)

export const getSession = (sessionId: string): Session | undefined =>
  sessionMap.get(sessionId)
