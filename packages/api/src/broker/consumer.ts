import { CONSUMER_INTERVAL_MS, ZENDESK_MAX_RETRIES } from '../config.ts'
import { createTicket, ZendeskUnavailableError } from '../integrations/zendesk.ts'
import { listReady, ack, nack, deadLetter } from './queue.ts'
import { getSession } from '../store/sessions.ts'

// Consumer: drains the escalation queue into Zendesk once it recovers. Re-submits each ready record with
// its stored idempotencyKey, so anything that actually landed during the outage is not duplicated, then
// backfills the real ticket ID onto the stored session trace so the Dashboard/TracePanel show it.

// give up after bounded attempts so a permanently-broken escalation is dead-lettered instead of looping
const MAX_ATTEMPTS = ZENDESK_MAX_RETRIES + 5

const backfillTrace = (sessionId: string, messageId: string, zendeskTicketId: string): void => {
  const session = getSession(sessionId)
  const trace = session?.traces.find((t) => t.messageId === messageId)
  if (trace) trace.zendeskTicketId = zendeskTicketId
}

// re-entrancy guard: only one drain runs at a time, so a slow drain (e.g. Zendesk timing out across many
// records) can't overlap with the next interval tick and double-deliver the same record.
let draining = false

export const consumeOnce = async (): Promise<void> => {
  if (draining) return
  draining = true
  try {
    for (const record of listReady()) {
      try {
        const ticket = await createTicket(record.payload) // stored key → no duplicate ticket
        ack(record.idempotencyKey, ticket.id)
        backfillTrace(record.sessionId, record.messageId, ticket.id)
      } catch (err) {
        if (!(err instanceof ZendeskUnavailableError)) throw err // real bug — surface it
        if (record.attempts + 1 >= MAX_ATTEMPTS) deadLetter(record.idempotencyKey, err.message)
        else nack(record.idempotencyKey, err.message)
      }
    }
  } finally {
    draining = false
  }
}

export const startConsumer = (): NodeJS.Timeout =>
  setInterval(() => {
    void consumeOnce()
  }, CONSUMER_INTERVAL_MS)
