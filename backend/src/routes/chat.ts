import type { FastifyInstance } from 'fastify'
import type { DecisionTrace, Message } from '@shared/types'
import { getCustomer } from '../services/salesforce.ts'
import { searchKnowledge } from '../services/knowledge.ts'
import { evaluateRules } from '../services/rules.ts'
import { createTicket } from '../services/zendesk.ts'
import { chat, type OllamaChatMessage } from '../services/ollama.ts'
import { ARTICLES } from '../data/articles.ts'
import { getOrCreateSession, appendToSession } from '../store/sessions.ts'

type ChatBody = {
  sessionId: string
  customerId: string
  message: string
}

const buildSystemPrompt = (
  customer: Awaited<ReturnType<typeof getCustomer>>,
  knowledgeMatches: Awaited<ReturnType<typeof searchKnowledge>>
): string => {
  const articles = knowledgeMatches
    .map((m) => ARTICLES.find((a) => a.id === m.articleId))
    .filter((a): a is NonNullable<typeof a> => a != null)

  const knowledgeContext = articles
    .map((a) => `### ${a.title}\n${a.content}`)
    .join('\n\n---\n\n')

  // EU injection overrides return window to 14 days and mandates GDPR-compliant language
  const euNote =
    customer.region === 'eu'
      ? '\nIMPORTANT: This is an EU customer. Apply GDPR-compliant language on any data topics. The statutory return window is 14 days for EU customers, not 30.\n'
      : ''

  return `You are an AI support agent for Ark Systems, a B2B and B2C enterprise technology company. Answer concisely, accurately, and professionally using only the knowledge base provided.${euNote}
## Customer Context
Name: ${customer.name}
Tier: ${customer.tier.toUpperCase()}
Region: ${customer.region.toUpperCase()}
Account Status: ${customer.accountStatus}
Products: ${customer.products.join(', ')}

## Knowledge Base
${knowledgeContext}`
}

export const chatRoutes = async (app: FastifyInstance): Promise<void> => {
  app.post<{ Body: ChatBody }>('/chat', async (request, reply) => {
    const { sessionId, customerId, message } = request.body

    if (!sessionId || !customerId || !message?.trim()) {
      return reply.code(422).send({
        error: { code: 'INVALID_INPUT', message: 'sessionId, customerId, and message are required', statusCode: 422 }
      })
    }

    const startTime = Date.now()
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

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
      const customer = await getCustomer(customerId)
      const knowledgeMatches = await searchKnowledge(message, 3)
      const { result: ruleResult, evaluations } = evaluateRules({ customer, query: message, knowledgeMatches })

      getOrCreateSession(sessionId, customerId)

      // built before branching so all three outcomes (escalate/route/answer) share the same common fields
      const baseTrace: Omit<DecisionTrace, 'decision' | 'zendeskTicketId' | 'llmPrompt' | 'latencyMs'> = {
        sessionId,
        messageId,
        timestamp: new Date().toISOString(),
        customerContext: {
          customerId: customer.customerId,
          tier: customer.tier,
          region: customer.region,
          accountStatus: customer.accountStatus
        },
        knowledgeMatches,
        rulesEvaluated: evaluations
      }

      if (ruleResult.action === 'escalate') {
        const ticket = await createTicket({
          customerId,
          sessionId,
          priority: (ruleResult.metadata.priority as 'urgent' | 'high' | 'normal' | 'low') ?? 'normal',
          reason: ruleResult.reason,
          conversationContext: message
        })

        const reply_text = `Your request has been escalated to our support team. A ticket has been created (${ticket.id}) and you will hear from us within your SLA window. We apologize for any inconvenience.`

        const trace: DecisionTrace = {
          ...baseTrace,
          decision: 'escalate',
          zendeskTicketId: ticket.id,
          latencyMs: Date.now() - startTime
        }

        const userMsg: Message = { id: `${messageId}-u`, role: 'user', content: message, timestamp: new Date().toISOString() }
        const assistantMsg: Message = { id: `${messageId}-a`, role: 'assistant', content: reply_text, timestamp: new Date().toISOString(), trace }
        appendToSession(sessionId, userMsg, trace)
        appendToSession(sessionId, assistantMsg, trace)

        emit({ type: 'done', reply: reply_text, trace, ticket })
        reply.raw.end()
        return reply

      } else if (ruleResult.action === 'route') {
        const routeResponse = ruleResult.metadata.response as string

        const trace: DecisionTrace = {
          ...baseTrace,
          decision: 'route',
          latencyMs: Date.now() - startTime
        }

        const userMsg: Message = { id: `${messageId}-u`, role: 'user', content: message, timestamp: new Date().toISOString() }
        const assistantMsg: Message = { id: `${messageId}-a`, role: 'assistant', content: routeResponse, timestamp: new Date().toISOString(), trace }
        appendToSession(sessionId, userMsg, trace)
        appendToSession(sessionId, assistantMsg, trace)

        emit({ type: 'done', reply: routeResponse, trace })
        reply.raw.end()
        return reply

      } else {
        const systemPrompt = buildSystemPrompt(customer, knowledgeMatches)
        const messages: OllamaChatMessage[] = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ]

        let fullReply = ''
        await chat(messages, (token) => {
          fullReply += token
          emit({ type: 'token', content: token })
        })

        const trace: DecisionTrace = {
          ...baseTrace,
          decision: 'answer',
          llmPrompt: systemPrompt,
          latencyMs: Date.now() - startTime
        }

        const userMsg: Message = { id: `${messageId}-u`, role: 'user', content: message, timestamp: new Date().toISOString() }
        const assistantMsg: Message = { id: `${messageId}-a`, role: 'assistant', content: fullReply, timestamp: new Date().toISOString(), trace }
        appendToSession(sessionId, userMsg, trace)
        appendToSession(sessionId, assistantMsg, trace)

        emit({ type: 'done', reply: fullReply, trace })
        reply.raw.end()
        return reply
      }
    } catch (err) {
      const message_err = err instanceof Error ? err.message : 'Pipeline error'
      emit({ type: 'error', message: message_err })
      reply.raw.end()
      return reply
    }
  })
}
