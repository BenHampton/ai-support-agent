import type { FastifyInstance } from 'fastify'
import { setZendeskDown, isZendeskDown, getZendeskFailureMode, type ZendeskFailureMode } from '../store/feature-flags.ts'
import { outboxDepth } from '../store/escalation-outbox.ts'

// Operator surface for the Zendesk-outage demo: flip the simulated outage on/off at runtime and read
// the current state + how many escalations are queued for reconciliation. Open endpoint — this is a
// local-only prototype; a real deployment would put auth in front of /admin/*.

type DownBody = { down: boolean; mode?: ZendeskFailureMode }

export const adminRoutes = async (app: FastifyInstance): Promise<void> => {
  app.post<{ Body: DownBody }>('/admin/zendesk/down', async (request) => {
    setZendeskDown(request.body.down, request.body.mode)
    return { data: { down: isZendeskDown(), mode: getZendeskFailureMode() } }
  })

  app.get('/admin/zendesk/status', async () => {
    return { data: { down: isZendeskDown(), mode: getZendeskFailureMode(), outboxDepth: outboxDepth() } }
  })
}
