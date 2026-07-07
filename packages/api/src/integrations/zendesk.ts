import { readFileSync } from 'fs'
import { join } from 'path'
import type { ZendeskTicket } from '@shared/types'
import {
  DATA_DIR,
  ZENDESK_TIMEOUT_MS,
  ZENDESK_MAX_RETRIES,
  ZENDESK_BREAKER_THRESHOLD,
  ZENDESK_BREAKER_COOLDOWN_MS
} from '../config.ts'
import { isZendeskDown, getZendeskFailureMode } from '../store/feature-flags.ts'

// mock Zendesk — in-memory store seeded from external data; created tickets stay in memory (not
// persisted back). Swap this for a real Zendesk integration. The resilience layer around the write
// (timeout, retry, circuit breaker, idempotency) is deliberately in this file so it is exercised by
// the mock AND carried over when the real client drops in.
const ticketStore: ZendeskTicket[] = JSON.parse(readFileSync(join(DATA_DIR, 'tickets.json'), 'utf-8')) as ZendeskTicket[]

// idempotency: maps a caller-supplied key to the ticket it produced, so a retry (or the reconciler
// re-submitting a queued record) returns the SAME ticket instead of creating a duplicate.
const ticketsByKey = new Map<string, ZendeskTicket>()

let ticketCounter = 1000 // starts high to produce realistic-looking IDs (ZD-1001, ZD-1002, …)

export type CreateTicketInput = {
  idempotencyKey: string
  customerId: string
  sessionId: string
  priority: ZendeskTicket['priority']
  reason: string
  conversationContext: string
}

// classify failures so callers, retry logic, and metrics can branch instead of parsing an opaque string.
// 'non_retryable' covers 4xx-style faults (validation/auth) that won't succeed on retry.
export type ZendeskErrorKind = 'timeout' | 'unavailable' | 'non_retryable'

export class ZendeskUnavailableError extends Error {
  readonly kind: ZendeskErrorKind
  readonly retryable: boolean
  constructor(kind: ZendeskErrorKind, message: string) {
    super(message)
    this.name = 'ZendeskUnavailableError'
    this.kind = kind
    this.retryable = kind !== 'non_retryable'
  }
}

// --- circuit breaker -------------------------------------------------------------------------------
// Once Zendesk is known-down, stop paying the full timeout+retry budget on every escalation — trip open
// after N consecutive failures and fail fast to the queue for a cooldown, then let one probe through.
let consecutiveFailures = 0
let openedAt = 0

const breakerOpen = (): boolean =>
  consecutiveFailures >= ZENDESK_BREAKER_THRESHOLD && Date.now() - openedAt < ZENDESK_BREAKER_COOLDOWN_MS

const recordSuccess = (): void => {
  consecutiveFailures = 0
}

const recordFailure = (): void => {
  consecutiveFailures++
  if (consecutiveFailures >= ZENDESK_BREAKER_THRESHOLD) openedAt = Date.now()
}

// test/support hook — reset breaker state so module-level counters don't leak across test cases
export const resetZendeskResilience = (): void => {
  consecutiveFailures = 0
  openedAt = 0
}

// --- helpers ---------------------------------------------------------------------------------------
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))
const backoff = (attempt: number): number => 2 ** attempt * 100 + Math.random() * 100 // exponential + jitter

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new ZendeskUnavailableError('timeout', `Zendesk timed out after ${ms}ms`)),
      ms
    )
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      }
    )
  })

// the actual (mock) create. Real work would be an HTTP POST to Zendesk here.
const doCreate = (input: CreateTicketInput): ZendeskTicket => {
  const existing = ticketsByKey.get(input.idempotencyKey)
  if (existing) return existing // idempotent: a retry never double-creates
  const ticket: ZendeskTicket = {
    id: `ZD-${++ticketCounter}`,
    customerId: input.customerId,
    sessionId: input.sessionId,
    priority: input.priority,
    reason: input.reason,
    conversationContext: input.conversationContext,
    createdAt: new Date().toISOString()
  }
  ticketStore.push(ticket)
  ticketsByKey.set(input.idempotencyKey, ticket)
  return ticket
}

// single network boundary. The outage flag injects failures indistinguishable from a real Zendesk fault
// so the whole resilience path (timeout/retry/breaker/queue) is exercised in the demo and tests.
const attemptCreate = (input: CreateTicketInput): Promise<ZendeskTicket> => {
  if (isZendeskDown()) {
    switch (getZendeskFailureMode()) {
      case 'hang':
        return new Promise<ZendeskTicket>(() => {}) // never resolves → withTimeout fires
      case '503':
        return Promise.reject(new ZendeskUnavailableError('unavailable', 'Zendesk returned 503'))
      default:
        return Promise.reject(new ZendeskUnavailableError('timeout', 'Zendesk request timed out'))
    }
  }
  return Promise.resolve(doCreate(input))
}

// Create a ticket with production-grade guardrails. Throws ZendeskUnavailableError when the backend is
// unreachable after retries (or the breaker is open); callers fall back to the durable queue.
export const createTicket = async (input: CreateTicketInput): Promise<ZendeskTicket> => {
  if (breakerOpen()) throw new ZendeskUnavailableError('unavailable', 'Zendesk circuit breaker open')

  let lastError: unknown
  for (let attempt = 0; attempt <= ZENDESK_MAX_RETRIES; attempt++) {
    try {
      const ticket = await withTimeout(attemptCreate(input), ZENDESK_TIMEOUT_MS)
      recordSuccess()
      return ticket
    } catch (err) {
      lastError = err
      recordFailure()
      const retryable = err instanceof ZendeskUnavailableError && err.retryable
      if (!retryable || attempt === ZENDESK_MAX_RETRIES) break
      await sleep(backoff(attempt))
    }
  }
  throw lastError
}

export const getTickets = (): ZendeskTicket[] => [...ticketStore]
