import { describe, it, expect } from 'vitest'
import { replayDeadLetter, replayAllDeadLetters } from './publisher.ts'
import { deadLetter, deadLetterSnapshot, queueSnapshot } from './queue.ts'
import type { QueueRecord } from './queue.ts'

const deadRecord = (idempotencyKey: string): QueueRecord => {
  const now = new Date().toISOString()
  return {
    idempotencyKey,
    status: 'dead-letter',
    payload: {
      idempotencyKey,
      customerId: 'vip-eu',
      sessionId: 'sess-replay',
      priority: 'urgent',
      reason: 'exhausted delivery',
      conversationContext: 'billing dispute'
    },
    sessionId: 'sess-replay',
    messageId: idempotencyKey,
    attempts: 7,
    createdAt: now,
    updatedAt: now,
    lastError: 'Zendesk request timed out'
  }
}

describe('publisher — operator replay of dead-lettered escalations', () => {
  it('moves a dead-letter back to the main queue with a fresh budget and clears it from the DLQ', () => {
    const key = 'replay-1'
    deadLetter(deadRecord(key))

    expect(replayDeadLetter(key)).toBe(true)

    // back on the main queue, ready with a reset budget
    const requeued = queueSnapshot().find((r) => r.idempotencyKey === key)
    expect(requeued?.status).toBe('ready')
    expect(requeued?.attempts).toBe(0)
    expect(requeued?.lastError).toBeUndefined()

    // gone from the DLQ, and a second replay is a no-op
    expect(deadLetterSnapshot().find((r) => r.idempotencyKey === key)).toBeUndefined()
    expect(replayDeadLetter(key)).toBe(false)
  })

  it('replayAllDeadLetters returns the number moved and empties the DLQ of them', () => {
    const keys = ['replay-all-a', 'replay-all-b']
    keys.forEach((k) => deadLetter(deadRecord(k)))

    const moved = replayAllDeadLetters()
    expect(moved).toBeGreaterThanOrEqual(keys.length)
    keys.forEach((k) => {
      expect(queueSnapshot().find((r) => r.idempotencyKey === k)?.status).toBe('ready')
      expect(deadLetterSnapshot().find((r) => r.idempotencyKey === k)).toBeUndefined()
    })
  })
})
