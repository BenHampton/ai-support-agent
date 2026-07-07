import { describe, it, expect } from 'vitest'
import { deadLetter, deadLetterDepth, deadLetterSnapshot } from './queue.ts'
import type { QueueRecord } from './queue.ts'

const makeRecord = (idempotencyKey: string): QueueRecord => {
  const now = new Date().toISOString()
  return {
    idempotencyKey,
    status: 'ready',
    payload: {
      idempotencyKey,
      customerId: 'vip-eu',
      sessionId: 'sess-dlq',
      priority: 'urgent',
      reason: 'exhausted delivery',
      conversationContext: 'billing dispute'
    },
    sessionId: 'sess-dlq',
    messageId: idempotencyKey,
    attempts: 7,
    createdAt: now,
    updatedAt: now
  }
}

describe('queue — the dead-letter queue store', () => {
  it('appends a record as dead-letter, exposes it via depth + snapshot, and is idempotent on re-append', () => {
    const before = deadLetterDepth()
    const key = `dlq-${before}-a`

    deadLetter(makeRecord(key))
    expect(deadLetterDepth()).toBe(before + 1)

    const stored = deadLetterSnapshot().find((r) => r.idempotencyKey === key)
    expect(stored?.status).toBe('dead-letter')

    // re-appending the same key is a no-op — a crash mid-move can't double-list the escalation
    deadLetter(makeRecord(key))
    expect(deadLetterDepth()).toBe(before + 1)
  })
})
