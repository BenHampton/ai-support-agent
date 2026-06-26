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

export const appendToSession = (sessionId: string, message: Message, trace: DecisionTrace): void => {
  const session = sessionMap.get(sessionId)
  if (!session) return
  session.messages.push(message)
  session.traces.push(trace)
  session.updatedAt = new Date().toISOString()
}

// strips messages to avoid sending full conversation payloads in the list endpoint
export const listSessions = (): Omit<Session, 'messages'>[] =>
  [...sessionMap.values()].map(({ messages: _m, ...rest }) => rest)

export const getSession = (sessionId: string): Session | undefined =>
  sessionMap.get(sessionId)
