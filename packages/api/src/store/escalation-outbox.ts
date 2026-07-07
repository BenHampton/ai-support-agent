import { readFileSync, writeFileSync, renameSync, existsSync } from 'fs'
import { join } from 'path'
import { DATA_DIR } from '../config.ts'
import type { CreateTicketInput } from '../integrations/zendesk.ts'

// Durable write-ahead outbox for escalations. This is the piece the rest of the app is missing:
// nothing else writes to disk (tickets.json and customers.json are read-once-at-seed). An escalation
// is a WRITE the customer was promised — if Zendesk can't accept it synchronously we must not drop it.
// So the intent is persisted here BEFORE the Zendesk call, and a background reconciler drains it once
// Zendesk recovers. The idempotencyKey (the request's messageId) makes retries and reconciliation safe:
// the same escalation is never enqueued or ticketed twice.
//
// In a real deployment this is a DB table or a managed queue (SQS/PubSub). For this file-based prototype
// it is an append-only JSON file with atomic writes (write .tmp + rename) so a crash mid-write can never
// corrupt it. An in-memory mirror is seeded from disk at startup, so pending escalations survive restart.

export type OutboxStatus = 'pending' | 'submitted' | 'failed'

export type OutboxRecord = {
  idempotencyKey: string
  status: OutboxStatus
  payload: CreateTicketInput
  sessionId: string
  messageId: string
  attempts: number
  createdAt: string
  updatedAt: string
  lastError?: string
  zendeskTicketId?: string
}

const FILE = join(DATA_DIR, 'escalation-outbox.json')
const TMP = `${FILE}.tmp`

const load = (): OutboxRecord[] =>
  existsSync(FILE) ? (JSON.parse(readFileSync(FILE, 'utf-8')) as OutboxRecord[]) : []

// disk is the source of truth on restart; this mirror is kept in sync on every mutation via flush()
const records: OutboxRecord[] = load()

const flush = (): void => {
  writeFileSync(TMP, JSON.stringify(records, null, 2))
  renameSync(TMP, FILE) // atomic swap — readers never observe a half-written file
}

const patch = (key: string, fields: Partial<OutboxRecord>): void => {
  const rec = records.find((r) => r.idempotencyKey === key)
  if (!rec) return
  Object.assign(rec, fields, { updatedAt: new Date().toISOString() })
  flush()
}

// write-ahead: called before the Zendesk attempt. Idempotent — a duplicate key is a no-op so a retried
// request can't double-enqueue.
export const enqueue = (record: OutboxRecord): void => {
  if (records.some((r) => r.idempotencyKey === record.idempotencyKey)) return
  records.push(record)
  flush()
}

export const markSubmitted = (key: string, zendeskTicketId: string): void =>
  patch(key, { status: 'submitted', zendeskTicketId })

// keep the record pending (still owed to Zendesk) and bump the attempt counter for the reconciler
export const recordFailure = (key: string, error: string): void => {
  const rec = records.find((r) => r.idempotencyKey === key)
  patch(key, { status: 'pending', lastError: error, attempts: (rec?.attempts ?? 0) + 1 })
}

// give up after bounded attempts so a permanently-broken escalation surfaces to on-call instead of
// retrying forever
export const markDeadLettered = (key: string, error: string): void =>
  patch(key, { status: 'failed', lastError: error })

export const listPending = (): OutboxRecord[] => records.filter((r) => r.status === 'pending')

export const outboxDepth = (): number => listPending().length

// read-only snapshot for the status endpoint and tests
export const outboxSnapshot = (): OutboxRecord[] => records.map((r) => ({ ...r }))
