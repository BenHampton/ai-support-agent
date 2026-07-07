import { describe, it, expect, afterEach } from 'vitest'
import { runReconcilerOnce } from './reconciler.ts'
import { runOrchestration } from './orchestration.ts'
import { setZendeskDown } from '../store/feature-flags.ts'
import { resetZendeskResilience } from '../integrations/zendesk.ts'
import { outboxSnapshot } from '../store/escalation-outbox.ts'
import { getSession } from '../store/sessions.ts'

// The orchestration path reaches the KB (embeddings) and, on ANSWER, the chat LLM. This test only drives
// an ESCALATE (vipBillingRule), so no LLM call happens — but stub both to keep the pipeline offline.
import { vi } from 'vitest'
vi.mock('./ollama.js', () => ({
  chat: async (): Promise<void> => {},
  embed: async (): Promise<number[]> => [0, 0, 0]
}))
vi.mock('./knowledge.js', () => ({
  searchKnowledge: async () => [],
  getChunksByIds: () => []
}))

describe('reconciler — drains the outbox and backfills the trace once Zendesk recovers', () => {
  afterEach(() => {
    setZendeskDown(false)
    resetZendeskResilience()
  })

  it('submits a pending escalation and backfills the real ticket id onto the session trace', async () => {
    // 1. Zendesk down → escalation degrades to a durable pending record with no ticket id
    resetZendeskResilience()
    setZendeskDown(true, 'timeout')
    const result = await runOrchestration(
      { sessionId: 'test-reconcile', customerId: 'vip-eu', message: 'I have a billing dispute on my invoice' },
      () => {}
    )
    const key = result.trace.messageId
    expect(result.trace.zendeskTicketId).toBeUndefined()
    expect(outboxSnapshot().find((r) => r.idempotencyKey === key)?.status).toBe('pending')

    // 2. Zendesk recovers → reconciler drains the outbox
    setZendeskDown(false)
    resetZendeskResilience()
    await runReconcilerOnce()

    // 3. the record is submitted with a real ZD- id, backfilled onto the stored trace
    const record = outboxSnapshot().find((r) => r.idempotencyKey === key)
    expect(record?.status).toBe('submitted')
    expect(record?.zendeskTicketId).toMatch(/^ZD-\d+$/)

    const trace = getSession('test-reconcile')?.traces.find((t) => t.messageId === key)
    expect(trace?.zendeskTicketId).toBe(record?.zendeskTicketId)
  })
})
