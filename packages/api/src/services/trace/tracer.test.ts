import { describe, it, expect } from 'vitest'
import type { Customer, KnowledgeBaseMatch, RuleEvaluation } from '@shared/types'
import { Tracer } from './tracer.ts'
import { getSession } from '../../store/sessions.ts'

const customer: Customer = {
  customerId: 'cust-1',
  name: 'Test Co',
  tier: 'enterprise',
  region: 'us',
  accountStatus: 'active',
  products: ['ArkBook Pro'],
  purchaseDate: '2025-01-01',
  entitlements: []
}
const matches: KnowledgeBaseMatch[] = [{ kbMatchId: 'kb-1#0', kbId: 'kb-1', score: 0.9, snippet: 's' }]
const evals: RuleEvaluation[] = [{ rule: 'someRule', fired: true, reason: 'because' }]

describe('Tracer', () => {
  it('commits a trace with base fields, decision, extras, and non-negative latency', () => {
    const tracer = new Tracer('sess-answer', customer, matches, evals)
    const trace = tracer.commit({ userMessage: 'hi', reply: 'hello', decision: 'answer', llmPrompt: 'PROMPT' })

    expect(trace.sessionId).toBe('sess-answer')
    expect(trace.messageId).toBe(tracer.messageId)
    expect(trace.decision).toBe('answer')
    expect(trace.llmPrompt).toBe('PROMPT')
    expect(trace.customerContext).toEqual({
      customerId: 'cust-1',
      tier: 'enterprise',
      region: 'us',
      accountStatus: 'active'
    })
    expect(trace.knowledgeMatches).toEqual(matches)
    expect(trace.rulesEvaluated).toEqual(evals)
    expect(trace.latencyMs).toBeGreaterThanOrEqual(0)
  })

  it('appends the turn (user + assistant messages + trace) to the session', () => {
    const tracer = new Tracer('sess-turn', customer, matches, evals)
    const trace = tracer.commit({ userMessage: 'hi', reply: 'hello', decision: 'route' })

    const session = getSession('sess-turn')
    expect(session).toBeDefined()
    expect(session!.messages).toHaveLength(2)
    expect(session!.messages[0]).toMatchObject({ role: 'user', content: 'hi', id: `${tracer.messageId}-u` })
    expect(session!.messages[1]).toMatchObject({ role: 'assistant', content: 'hello', id: `${tracer.messageId}-a` })
    expect(session!.messages[1].trace).toBe(trace)
    expect(session!.traces).toEqual([trace])
  })

  it('keeps messageId stable across commit', () => {
    const tracer = new Tracer('sess-stable', customer, matches, evals)
    const id = tracer.messageId
    tracer.commit({ userMessage: 'a', reply: 'b', decision: 'escalate' })
    expect(tracer.messageId).toBe(id)
  })
})
