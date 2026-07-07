import type { CreateTicketInput } from '../integrations/zendesk.ts'
import { enqueue, deadLetterSnapshot, removeDeadLetter, type QueueRecord } from './queue.ts'

// Producer: everything that puts records onto the main queue — publishing new escalations, and replaying
// dead-lettered ones back once an operator has fixed the cause.

// publish a new escalation: turn the payload into a durable 'ready' message BEFORE any Zendesk call, so a
// backend outage or a crash mid-call can never lose the intent. The idempotencyKey (carried on the
// payload) dedupes retries — enqueue is a no-op on a duplicate key.
export const publish = (payload: CreateTicketInput, ctx: { sessionId: string; messageId: string }): QueueRecord => {
  const now = new Date().toISOString()
  const record: QueueRecord = {
    idempotencyKey: payload.idempotencyKey,
    status: 'ready',
    payload,
    sessionId: ctx.sessionId,
    messageId: ctx.messageId,
    attempts: 0,
    createdAt: now,
    updatedAt: now
  }
  enqueue(record)
  return record
}

// operator replay: move a dead-lettered escalation back onto the main queue for another delivery attempt
// once the cause is fixed. Deliberately manual — auto-draining the DLQ would just re-run the retry loop
// the DLQ exists to stop. Enqueue-first (idempotent) then remove from the DLQ, so a crash between the two
// writes can't lose it. Fresh delivery budget: status 'ready', attempts reset, error cleared.
const requeue = (record: QueueRecord): void => {
  enqueue({ ...record, status: 'ready', attempts: 0, lastError: undefined, updatedAt: new Date().toISOString() })
  removeDeadLetter(record.idempotencyKey)
}

export const replayDeadLetter = (key: string): boolean => {
  const record = deadLetterSnapshot().find((r) => r.idempotencyKey === key)
  if (!record) return false
  requeue(record)
  return true
}

export const replayAllDeadLetters = (): number => {
  const records = deadLetterSnapshot()
  records.forEach(requeue)
  return records.length
}
