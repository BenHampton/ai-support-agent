import type { CreateTicketInput } from '../integrations/zendesk.ts'
import { enqueue, type QueueRecord } from './queue.ts'

// Producer: turn an escalation payload into a durable queued message (status 'ready') and publish it to
// the queue BEFORE any Zendesk call, so a backend outage or a crash mid-call can never lose the intent.
// The idempotencyKey (carried on the payload) dedupes retries — enqueue is a no-op on a duplicate key.
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
