import type { FastifyInstance } from 'fastify'
import { listSessions, getSession } from '../store/sessions.ts'

export const sessionRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get('/sessions', async () => {
    return { data: listSessions() }
  })

  app.get<{ Params: { id: string } }>('/sessions/:id/trace', async (request, reply) => {
    const session = getSession(request.params.id)
    if (!session) {
      return reply.code(404).send({
        error: { code: 'SESSION_NOT_FOUND', message: `Session ${request.params.id} not found`, statusCode: 404 }
      })
    }
    return { data: { sessionId: session.sessionId, traces: session.traces } }
  })
}
