import type { FastifyInstance } from 'fastify'
import { searchKnowledge } from '../services/knowledge.ts'

export const knowledgeRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get('/knowledge/search', async (request, reply) => {
    const { q } = request.query as { q?: string }
    if (!q?.trim()) {
      return reply.code(422).send({
        error: { code: 'MISSING_QUERY', message: 'q parameter is required', statusCode: 422 }
      })
    }
    try {
      const matches = await searchKnowledge(q, 3)
      return { data: matches }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Knowledge search failed'
      return reply.code(500).send({ error: { code: 'SEARCH_FAILED', message, statusCode: 500 } })
    }
  })
}
