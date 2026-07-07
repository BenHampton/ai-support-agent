import { describe, it, expect, afterEach } from 'vitest'
import { consumeOnce } from './consumer.ts'
import { runOrchestration } from '../services/orchestration.ts'
import { setZendeskDown } from '../store/feature-flags.ts'
import { resetZendeskResilience } from '../integrations/zendesk.ts'
import { queueSnapshot } from './queue.ts'
import { getSession } from '../store/sessions.ts'

// The orchestration path reaches the KB (embeddings) and, on ANSWER, the chat LLM. This test only drives
// an ESCALATE (vipBillingRule), so no LLM call happens — but stub both to keep the pipeline offline.
import { vi } from 'vitest'
vi.mock('../services/ollama.js', () => ({
  chat: async (): Promise<void> => {},
  embed: async (): Promise<number[]> => [0, 0, 0]
}))
vi.mock('../services/knowledge.js', () => ({
  searchKnowledge: async () => [],
  getChunksByIds: () => []
}))

describe('consumer — drains the queue and backfills the trace once Zendesk recovers', () => {
  afterEach(() => {
    setZendeskDown(false)
    resetZendeskResilience()
  })

  it('submits a ready escalation and backfills the real ticket id onto the session trace', async () => {
    // 1. Zendesk down → escalation degrades to a durable ready record with no ticket id
    resetZendeskResilience()
    setZendeskDown(true, 'timeout')
    const result = await runOrchestration(
      { sessionId: 'test-reconcile', customerId: 'vip-eu', message: 'I have a billing dispute on my invoice' },
      () => {}
    )
    const key = result.trace.messageId
    expect(result.trace.zendeskTicketId).toBeUndefined()
    expect(queueSnapshot().find((r) => r.idempotencyKey === key)?.status).toBe('ready')

    // 2. Zendesk recovers → consumer drains the queue
    setZendeskDown(false)
    resetZendeskResilience()
    await consumeOnce()

    // 3. the record is acked with a real ZD- id, backfilled onto the stored trace
    const record = queueSnapshot().find((r) => r.idempotencyKey === key)
    expect(record?.status).toBe('acked')
    expect(record?.zendeskTicketId).toMatch(/^ZD-\d+$/)

    const trace = getSession('test-reconcile')?.traces.find((t) => t.messageId === key)
    expect(trace?.zendeskTicketId).toBe(record?.zendeskTicketId)
  })
})
