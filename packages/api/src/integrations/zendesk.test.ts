import { describe, it, expect } from 'vitest'
import { createTicket, getTickets } from './zendesk.ts'

describe('zendesk ticket store', () => {
  it('createTicket adds a ZD-prefixed ticket that getTickets surfaces', async () => {
    const before = getTickets().length
    const ticket = await createTicket({
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
