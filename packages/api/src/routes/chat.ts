import type { FastifyInstance } from 'fastify'
import { runOrchestration } from '../services/orchestration.ts'
import { MAX_MESSAGE_LENGTH } from '../config.ts'

type ChatBody = {
  sessionId: string
  customerId: string
  message: string
}

export const chatRoutes = async (app: FastifyInstance): Promise<void> => {
  app.post<{ Body: ChatBody }>('/chat', async (request, reply) => {
    const { sessionId, customerId, message } = request.body

    if (!sessionId || !customerId || !message?.trim()) {
      return reply.code(422).send({
        error: { code: 'INVALID_INPUT', message: 'sessionId, customerId, and message are required', statusCode: 422 }
      })
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return reply.code(422).send({
        error: { code: 'INVALID_INPUT', message: `message exceeds ${MAX_MESSAGE_LENGTH} characters`, statusCode: 422 }
      })
    }

    // raw response required for SSE — Fastify's reply abstraction can't stream this way
    reply.raw.setHeader('Content-Type', 'text/event-stream')
    reply.raw.setHeader('Cache-Control', 'no-cache')
    reply.raw.setHeader('Connection', 'keep-alive')
    reply.raw.setHeader('Access-Control-Allow-Origin', '*')

    // formats each SSE frame: "data: <json>\n\n"
    const emit = (data: unknown): void => {
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`)
    }

    try {
      const result = await runOrchestration(
        { sessionId, customerId, message },
        (token) => emit({ type: 'token', content: token })
      )
      emit({ type: 'done', ...result })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Orchestration error'
      emit({ type: 'error', message: msg })
    }

    reply.raw.end()
    return reply
  })
}
