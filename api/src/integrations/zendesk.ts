import type { ZendeskTicket } from '@shared/types'
import { ticketStore } from '../data/tickets.ts'

type CreateTicketInput = {
  customerId: string
  sessionId: string
  priority: ZendeskTicket['priority']
  reason: string
  conversationContext: string
}

let ticketCounter = 1000 // starts high to produce realistic-looking IDs (ZD-1001, ZD-1002, …)

export const createTicket = async (input: CreateTicketInput): Promise<ZendeskTicket> => {
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
  return ticket
}

export const getTickets = (): ZendeskTicket[] => [...ticketStore]
