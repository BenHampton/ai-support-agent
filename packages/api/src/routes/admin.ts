import type { FastifyInstance } from 'fastify'
import { setZendeskDown, isZendeskDown, getZendeskFailureMode, type ZendeskFailureMode } from '../store/feature-flags.ts'
import { queueDepth, deadLetterDepth, deadLetterSnapshot } from '../broker/queue.ts'
import { replayDeadLetter, replayAllDeadLetters } from '../broker/publisher.ts'

// Operator surface for the Zendesk-outage demo: flip the simulated outage on/off at runtime and read
// the current state, how many escalations are queued for delivery, and how many have dead-lettered.
// Open endpoint — this is a local-only prototype; a real deployment would put auth in front of /admin/*.

type DownBody = { down: boolean; mode?: ZendeskFailureMode }

export const adminRoutes = async (app: FastifyInstance): Promise<void> => {
  app.post<{ Body: DownBody }>('/admin/zendesk/down', async (request) => {
    setZendeskDown(request.body.down, request.body.mode)
    return { data: { down: isZendeskDown(), mode: getZendeskFailureMode() } }
  })

  app.get('/admin/zendesk/status', async () => {
    return {
      data: {
        down: isZendeskDown(),
        mode: getZendeskFailureMode(),
        queueDepth: queueDepth(),
        deadLetterDepth: deadLetterDepth()
      }
    }
  })

  // inspect the dead-letter queue — escalations that exhausted delivery and need manual attention
  app.get('/admin/zendesk/dead-letters', async () => {
    return { data: deadLetterSnapshot() }
  })

  // operator redrive: move all dead-letters back onto the main queue with a fresh attempt budget (after
  // the cause is fixed). Manual by design — the DLQ is not auto-drained.
  app.post('/admin/zendesk/dead-letters/replay', async () => {
    return { data: { replayed: replayAllDeadLetters() } }
  })

  app.post<{ Params: { key: string } }>('/admin/zendesk/dead-letters/:key/replay', async (request) => {
    return { data: { replayed: replayDeadLetter(request.params.key) } }
  })
}
