import Fastify from 'fastify'
import cors from '@fastify/cors'
import { initKnowledge } from './services/knowledge.ts'
import { knowledgeRoutes } from './routes/knowledge.ts'
import { chatRoutes } from './routes/chat.ts'
import { sessionRoutes } from './routes/sessions.ts'
import { customerRoutes } from './routes/customers.ts'
import { ticketRoutes } from './routes/tickets.ts'
import { adminRoutes } from './routes/admin.ts'
import { startReconciler } from './services/reconciler.ts'

const app = Fastify({ logger: { level: 'info' } })

await app.register(cors, { origin: /^http:\/\/localhost:\d+$/ }) // localhost only
await app.register(knowledgeRoutes)
await app.register(chatRoutes)
await app.register(sessionRoutes)
await app.register(customerRoutes)
await app.register(ticketRoutes)
await app.register(adminRoutes)

app.get('/health', async () => {
  return { data: { status: 'ok' } }
})

const start = async (): Promise<void> => {
  try {
    await app.listen({ port: parseInt(process.env.PORT ?? '3001'), host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
  // intentionally after listen() — server accepts requests while embeddings warm up
  initKnowledge().catch((err) => {
    app.log.warn({ err }, '[knowledge] Initialization failed — pull Ollama models and restart')
  })

  // drain any escalations queued during a Zendesk outage; safe to start immediately (no-op when empty)
  startReconciler()
}

start()
