import { describe, it, expect, afterEach } from 'vitest'
import { consumeOnce } from './consumer.ts'
import { runOrchestration } from '../services/orchestration.ts'
import { setZendeskDown } from '../store/feature-flags.ts'
import { resetZendeskResilience } from '../integrations/zendesk.ts'
import { queueSnapshot, nack, deadLetterSnapshot } from './queue.ts'
import { publish } from './publisher.ts'
import { ZENDESK_MAX_RETRIES } from '../config.ts'
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

  it('moves a record to the DLQ (out of the main queue) once delivery attempts are exhausted', async () => {
    const MAX_ATTEMPTS = ZENDESK_MAX_RETRIES + 5
    const key = 'dlq-exhaust-1'

    // publish a ready record, then cheaply drive it to the brink of exhaustion with direct nacks
    // (bumps attempts without incurring real Zendesk retry backoff)
    publish(
      { idempotencyKey: key, customerId: 'vip-eu', sessionId: 'sess-exhaust', priority: 'urgent', reason: 'r', conversationContext: 'billing dispute' },
      { sessionId: 'sess-exhaust', messageId: key }
    )
    for (let i = 0; i < MAX_ATTEMPTS - 1; i++) nack(key, 'still down')
    expect(queueSnapshot().find((r) => r.idempotencyKey === key)?.attempts).toBe(MAX_ATTEMPTS - 1)

    // one more failed delivery tips it over the threshold → move to the DLQ
    resetZendeskResilience()
    setZendeskDown(true, 'timeout')
    await consumeOnce()

    // gone from the main queue, present in the DLQ as dead-letter
    expect(queueSnapshot().find((r) => r.idempotencyKey === key)).toBeUndefined()
    const dead = deadLetterSnapshot().find((r) => r.idempotencyKey === key)
    expect(dead?.status).toBe('dead-letter')
    expect(dead?.lastError).toBeTruthy()
  })
})
