import type { FastifyInstance } from 'fastify'
import { getTickets } from '../integrations/zendesk.ts'

export const ticketRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get('/tickets', async () => {
    return { data: getTickets() }
  })
}
