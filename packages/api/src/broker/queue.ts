import { readFileSync, writeFileSync, renameSync, existsSync } from 'fs'
import { join } from 'path'
import { DATA_DIR } from '../config.ts'
import type { CreateTicketInput } from '../integrations/zendesk.ts'

// Durable escalation queue. This is the piece the rest of the app is missing: nothing else writes to
// disk (tickets.json and customers.json are read-once-at-seed). An escalation is a WRITE the customer
// was promised — if Zendesk can't accept it synchronously we must not drop it. So the intent is
// persisted here BEFORE the Zendesk call, and the background consumer drains it once Zendesk recovers.
// The idempotencyKey (the request's messageId) makes retries and reconciliation safe: the same
// escalation is never enqueued or ticketed twice.
//
// Broker semantics: a record is enqueued 'ready', becomes 'acked' once Zendesk accepts it, and is
// 'dead-letter'ed after bounded delivery attempts (a nack requeues it as 'ready' and bumps the counter).
// This module is the passive queue itself — the publisher produces to it, the consumer drains it.
//
// In a real deployment this is a DB table or a managed queue (SQS/PubSub). For this file-based prototype
// it is an append-only JSON file with atomic writes (write .tmp + rename) so a crash mid-write can never
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

const FILE = join(DATA_DIR, 'escalation-queue.json')
const TMP = `${FILE}.tmp`

const load = (): QueueRecord[] =>
  existsSync(FILE) ? (JSON.parse(readFileSync(FILE, 'utf-8')) as QueueRecord[]) : []

// disk is the source of truth on restart; this mirror is kept in sync on every mutation via flush()
const records: QueueRecord[] = load()

const flush = (): void => {
  writeFileSync(TMP, JSON.stringify(records, null, 2))
  renameSync(TMP, FILE) // atomic swap — readers never observe a half-written file
}

const patch = (key: string, fields: Partial<QueueRecord>): void => {
  const rec = records.find((r) => r.idempotencyKey === key)
  if (!rec) return
  Object.assign(rec, fields, { updatedAt: new Date().toISOString() })
  flush()
}

// write-ahead: called before the Zendesk attempt. Idempotent — a duplicate key is a no-op so a retried
// request can't double-enqueue.
export const enqueue = (record: QueueRecord): void => {
  if (records.some((r) => r.idempotencyKey === record.idempotencyKey)) return
  records.push(record)
  flush()
}

// delivery acknowledged — Zendesk accepted the ticket
export const ack = (key: string, zendeskTicketId: string): void =>
  patch(key, { status: 'acked', zendeskTicketId })

// negative ack: requeue the record ('ready', still owed to Zendesk) and bump the attempt counter so the
// consumer retries it
export const nack = (key: string, error: string): void => {
  const rec = records.find((r) => r.idempotencyKey === key)
  patch(key, { status: 'ready', lastError: error, attempts: (rec?.attempts ?? 0) + 1 })
}

// dead-letter after bounded attempts so a permanently-broken escalation surfaces to on-call instead of
// retrying forever
export const deadLetter = (key: string, error: string): void =>
  patch(key, { status: 'dead-letter', lastError: error })

export const listReady = (): QueueRecord[] => records.filter((r) => r.status === 'ready')

export const queueDepth = (): number => listReady().length

// read-only snapshot for the status endpoint and tests
export const queueSnapshot = (): QueueRecord[] => records.map((r) => ({ ...r }))
