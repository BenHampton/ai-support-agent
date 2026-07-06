import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ZENDESK_TIMEOUT_MS, ZENDESK_MAX_RETRIES } from '../config.ts'
import { createTicket, getTickets, ZendeskUnavailableError, resetZendeskResilience } from './zendesk.ts'
import { setZendeskDown } from '../store/feature-flags.ts'

// reset the breaker so module-level failure counters don't leak between cases, and always leave Zendesk
// "up" so unrelated tests aren't affected by a lingering simulated outage
beforeEach(() => resetZendeskResilience())
afterEach(() => {
  setZendeskDown(false)
  resetZendeskResilience()
})

describe('zendesk ticket store', () => {
  it('createTicket adds a ZD-prefixed ticket that getTickets surfaces', async () => {
    const before = getTickets().length
    const ticket = await createTicket({
      idempotencyKey: 'store-1',
      customerId: 'vip-eu',
      sessionId: 'session-test',
      priority: 'urgent',
      reason: 'VIP billing escalation',
      conversationContext: 'billing dispute'
    })

    expect(ticket.id).toMatch(/^ZD-\d+$/)

    const tickets = getTickets()
    expect(tickets.length).toBe(before + 1)
    expect(tickets.find((t) => t.id === ticket.id)).toEqual(ticket)
  })

  it('getTickets returns a copy — mutating it does not affect the store', () => {
    const list = getTickets()
    const before = list.length
    list.push({
      id: 'ZD-9999',
      customerId: 'x',
      sessionId: 'x',
      priority: 'low',
      reason: 'x',
      conversationContext: 'x',
      createdAt: new Date().toISOString()
    })
    expect(getTickets().length).toBe(before)
  })
})

describe('zendesk resilience', () => {
  it('idempotency: the same key never creates a second ticket', async () => {
    const input = {
      idempotencyKey: 'idem-1',
      customerId: 'vip-eu',
      sessionId: 's',
      priority: 'urgent' as const,
      reason: 'r',
      conversationContext: 'c'
    }
    const before = getTickets().length
    const first = await createTicket(input)
    const second = await createTicket(input)
    expect(second.id).toBe(first.id)
    expect(getTickets().length).toBe(before + 1)
  })

  it('503 outage: retries a retryable error then throws ZendeskUnavailableError', async () => {
    setZendeskDown(true, '503')
    await expect(
      createTicket({ idempotencyKey: 'down-503', customerId: 'c', sessionId: 's', priority: 'normal', reason: 'r', conversationContext: 'c' })
    ).rejects.toBeInstanceOf(ZendeskUnavailableError)
  })

  it('hang: the per-call timeout fires when the backend never responds', async () => {
    vi.useFakeTimers()
    try {
      setZendeskDown(true, 'hang')
      const settled = createTicket({
        idempotencyKey: 'down-hang',
        customerId: 'c',
        sessionId: 's',
        priority: 'normal',
        reason: 'r',
        conversationContext: 'c'
      }).then(
        () => null,
        (err) => err
      )
      // advance past every attempt's timeout plus backoff waits so the retry loop exhausts
      await vi.advanceTimersByTimeAsync(ZENDESK_TIMEOUT_MS * (ZENDESK_MAX_RETRIES + 1) + 2000)
      const err = await settled
      expect(err).toBeInstanceOf(ZendeskUnavailableError)
      expect((err as ZendeskUnavailableError).kind).toBe('timeout')
    } finally {
      vi.useRealTimers()
    }
  })
})
