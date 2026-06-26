import type { FastifyInstance } from 'fastify'
import { listCustomers } from '../integrations/salesforce.ts'

export const customerRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get('/customers', async () => {
    const customers = await listCustomers()
    return { data: customers }
  })
}
