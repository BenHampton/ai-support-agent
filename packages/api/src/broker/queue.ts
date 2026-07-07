import { readFileSync, writeFileSync, renameSync, existsSync } from 'fs'
import { join } from 'path'
import { DATA_DIR } from '../config.ts'
import type { CreateTicketInput } from '../integrations/zendesk.ts'

// Durable escalation queue + its dead-letter queue. This is the piece the rest of the app is missing:
// nothing else writes to disk (tickets.json and customers.json are read-once-at-seed). An escalation is a
// WRITE the customer was promised — if Zendesk can't accept it we must not drop it. So the intent is
// persisted here BEFORE the Zendesk call, and the background consumer drains it once Zendesk recovers.
// The idempotencyKey (the request's messageId) makes retries and reconciliation safe: the same escalation
// is never enqueued or ticketed twice.
//
// Broker semantics: a record is enqueued 'ready', becomes 'acked' once Zendesk accepts it, and — after
// bounded delivery attempts — is MOVED to the physically separate dead-letter queue (a nack requeues it
// as 'ready' and bumps the counter). This module is the passive storage for both queues; the publisher
// produces to the queue, the consumer drains it and dead-letters, and the publisher replays from the DLQ.
//
// In a real deployment these are DB tables or a managed queue (SQS/PubSub). For this file-based prototype
// each is an append-only JSON file with atomic writes (write .tmp + rename) so a crash mid-write can never
// corrupt it. An in-memory mirror is seeded from disk at startup, so queued escalations survive restart.

export type QueueStatus = 'ready' | 'acked' | 'dead-letter'

export type QueueRecord = {
  idempotencyKey: string
  status: QueueStatus
  payload: CreateTicketInput
  sessionId: string
  messageId: string
  attempts: number
  createdAt: string
  updatedAt: string
  lastError?: string
  zendeskTicketId?: string
}

// a durable, file-backed record store: in-memory mirror seeded from disk + atomic flush. Instantiated
// once for the main queue and once for the DLQ so they don't duplicate the persistence machinery.
const openStore = (filename: string): { records: QueueRecord[]; flush: () => void } => {
  const FILE = join(DATA_DIR, filename)
  const TMP = `${FILE}.tmp`
  const records: QueueRecord[] = existsSync(FILE) ? (JSON.parse(readFileSync(FILE, 'utf-8')) as QueueRecord[]) : []
  const flush = (): void => {
    writeFileSync(TMP, JSON.stringify(records, null, 2))
    renameSync(TMP, FILE) // atomic swap — readers never observe a half-written file
  }
  return { records, flush }
}

const main = openStore('escalation-queue.json')
const dlq = openStore('escalation-dlq.json')

// --- main queue ------------------------------------------------------------------------------------

const patch = (key: string, fields: Partial<QueueRecord>): void => {
  const rec = main.records.find((r) => r.idempotencyKey === key)
  if (!rec) return
  Object.assign(rec, fields, { updatedAt: new Date().toISOString() })
  main.flush()
}

// write-ahead: called before the Zendesk attempt. Idempotent — a duplicate key is a no-op so a retried
// request can't double-enqueue.
export const enqueue = (record: QueueRecord): void => {
  if (main.records.some((r) => r.idempotencyKey === record.idempotencyKey)) return
  main.records.push(record)
  main.flush()
}

// delivery acknowledged — Zendesk accepted the ticket
export const ack = (key: string, zendeskTicketId: string): void =>
  patch(key, { status: 'acked', zendeskTicketId })

// negative ack: requeue the record ('ready', still owed to Zendesk) and bump the attempt counter so the
// consumer retries it
export const nack = (key: string, error: string): void => {
  const rec = main.records.find((r) => r.idempotencyKey === key)
  patch(key, { status: 'ready', lastError: error, attempts: (rec?.attempts ?? 0) + 1 })
}

// evict a record from the main queue — used once it's been moved to the DLQ (dead-lettering is a MOVE,
// not an in-place status flip), so main-queue records are only ever 'ready' or 'acked'.
export const remove = (key: string): void => {
  const i = main.records.findIndex((r) => r.idempotencyKey === key)
  if (i === -1) return
  main.records.splice(i, 1)
  main.flush()
}

export const listReady = (): QueueRecord[] => main.records.filter((r) => r.status === 'ready')

export const queueDepth = (): number => listReady().length

// read-only snapshot for the status endpoint and tests
export const queueSnapshot = (): QueueRecord[] => main.records.map((r) => ({ ...r }))

// --- dead-letter queue -----------------------------------------------------------------------------
// A physically separate queue: escalations that exhaust delivery are MOVED here so they stop retrying and
// become visible for on-call. Append is idempotent so a crash between "append to DLQ" and "remove from
// main" (see consumer.ts) can't double-list the same escalation.

export const deadLetter = (record: QueueRecord): void => {
  if (dlq.records.some((r) => r.idempotencyKey === record.idempotencyKey)) return
  dlq.records.push({ ...record, status: 'dead-letter' })
  dlq.flush()
}

export const removeDeadLetter = (key: string): void => {
  const i = dlq.records.findIndex((r) => r.idempotencyKey === key)
  if (i === -1) return
  dlq.records.splice(i, 1)
  dlq.flush()
}

export const deadLetterDepth = (): number => dlq.records.length

// read-only snapshot for the admin inspection endpoint and tests
export const deadLetterSnapshot = (): QueueRecord[] => dlq.records.map((r) => ({ ...r }))
