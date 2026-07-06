import { describe, it, expect } from 'vitest'
import type { DecisionTrace, Message } from '@shared/types'
import { getOrCreateSession, appendTurn, getSession } from './sessions.ts'

const msg = (id: string, role: Message['role']): Message => ({
  id,
  role,
  content: 'x',
  timestamp: new Date().toISOString()
})

const trace = (): DecisionTrace => ({
  sessionId: 's',
  messageId: `m-${Math.random()}`,
  timestamp: new Date().toISOString(),
  customerContext: { customerId: 'consumer-us', tier: 'consumer', region: 'us', accountStatus: 'active' },
  knowledgeMatches: [],
  rulesEvaluated: [],
  decision: 'escalate',
  latencyMs: 1
})

describe('appendTurn', () => {
  it('stores one trace per turn but both messages', () => {
    const id = 'session-one-turn'
    getOrCreateSession(id, 'consumer-us')
    appendTurn(id, [msg('a-u', 'user'), msg('a-a', 'assistant')], trace())

    const session = getSession(id)!
    expect(session.traces).toHaveLength(1) // one request → one trace card, not one per message
    expect(session.messages).toHaveLength(2)
  })

  it('accumulates one trace per subsequent turn', () => {
    const id = 'session-two-turns'
    getOrCreateSession(id, 'consumer-us')
    appendTurn(id, [msg('a-u', 'user'), msg('a-a', 'assistant')], trace())
    appendTurn(id, [msg('b-u', 'user'), msg('b-a', 'assistant')], trace())

    const session = getSession(id)!
    expect(session.traces).toHaveLength(2)
    expect(session.messages).toHaveLength(4)
  })
})
