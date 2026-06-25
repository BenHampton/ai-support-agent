import type { DecisionTrace, Message, ZendeskTicket } from '@shared/types'
import { getCustomer } from '../integrations/salesforce.ts'
import { searchKnowledge, getChunksByIds } from './knowledge.js'
import { runRulesEngine } from '../rules/engine.ts'
import { createTicket } from '../integrations/zendesk.ts'
import { chat, type OllamaChatMessage } from './ollama.js'
import { getOrCreateSession, appendToSession } from '../store/sessions.ts'

export type ChatInput = {
  sessionId: string
  customerId: string
  message: string
}

export type ChatResult = {
  decision: 'escalate' | 'route' | 'answer'
  reply: string
  trace: DecisionTrace
  ticket?: ZendeskTicket
}

const buildSystemPrompt = (
  customer: Awaited<ReturnType<typeof getCustomer>>,
  knowledgeMatches: Awaited<ReturnType<typeof searchKnowledge>>
): string => {
  // inject only the matched chunks, grouped under their KB doc title — keeps the
  // prompt focused on the retrieved slices rather than whole documents
  const chunks = getChunksByIds(knowledgeMatches.map((m) => m.kbMatchId))

  const chunksByDoc = new Map<string, string[]>()
  for (const chunk of chunks) {
    const existing = chunksByDoc.get(chunk.title) ?? []
    existing.push(chunk.content)
    chunksByDoc.set(chunk.title, existing)
  }

  const knowledgeContext = Array.from(chunksByDoc.entries())
    .map(([title, contents]) => `### ${title}\n${contents.join('\n\n')}`)
    .join('\n\n---\n\n')

  // EU injection overrides return window to 14 days and mandates GDPR-compliant language
  const euNote =
    customer.region === 'eu'
      ? '\nIMPORTANT: This is an EU customer. Apply GDPR-compliant language on any data topics. The statutory return window is 14 days for EU customers, not 30.\n'
      : ''

  return `You are an AI support agent for Ark Systems, a B2B and B2C enterprise technology company. Answer concisely, accurately, and professionally using only the knowledge base provided.${euNote}
## Customer Context
Customer ID: ${customer.customerId}
Name: ${customer.name}
Tier: ${customer.tier.toUpperCase()}
Region: ${customer.region.toUpperCase()}
Account Status: ${customer.accountStatus}
Products: ${customer.products.join(', ')}

## Knowledge Base
${knowledgeContext}`
}

export const runOrchestration = async (
  { sessionId, customerId, message }: ChatInput,
  onToken: (token: string) => void
): Promise<ChatResult> => {
  const startTime = Date.now()
  const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  const customer = await getCustomer(customerId)
  const knowledgeMatches = await searchKnowledge(message)
  const { result: ruleResult, evaluations } = runRulesEngine({ customer, query: message, knowledgeMatches })

  getOrCreateSession(sessionId, customerId)

  // built before branching so all three outcomes share the same common fields
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

    const reply = `Your request has been escalated to our support team. A ticket has been created (${ticket.id}) and you will hear from us within your SLA window. We apologize for any inconvenience.`
    const trace: DecisionTrace = { ...baseTrace, decision: 'escalate', zendeskTicketId: ticket.id, latencyMs: Date.now() - startTime }

    const userMsg: Message = { id: `${messageId}-u`, role: 'user', content: message, timestamp: new Date().toISOString() }
    const assistantMsg: Message = { id: `${messageId}-a`, role: 'assistant', content: reply, timestamp: new Date().toISOString(), trace }
    appendToSession(sessionId, userMsg, trace)
    appendToSession(sessionId, assistantMsg, trace)

    return { decision: 'escalate', reply, trace, ticket }
  }

  if (ruleResult.action === 'route') {
    const reply = ruleResult.metadata.response as string
    const trace: DecisionTrace = { ...baseTrace, decision: 'route', latencyMs: Date.now() - startTime }

    const userMsg: Message = { id: `${messageId}-u`, role: 'user', content: message, timestamp: new Date().toISOString() }
    const assistantMsg: Message = { id: `${messageId}-a`, role: 'assistant', content: reply, timestamp: new Date().toISOString(), trace }
    appendToSession(sessionId, userMsg, trace)
    appendToSession(sessionId, assistantMsg, trace)

    return { decision: 'route', reply, trace }
  }

  const systemPrompt = buildSystemPrompt(customer, knowledgeMatches)
  const messages: OllamaChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: message }
  ]

  let fullReply = ''
  await chat(messages, (token) => {
    fullReply += token
    onToken(token)
  })

  const trace: DecisionTrace = { ...baseTrace, decision: 'answer', llmPrompt: systemPrompt, latencyMs: Date.now() - startTime }

  const userMsg: Message = { id: `${messageId}-u`, role: 'user', content: message, timestamp: new Date().toISOString() }
  const assistantMsg: Message = { id: `${messageId}-a`, role: 'assistant', content: fullReply, timestamp: new Date().toISOString(), trace }
  appendToSession(sessionId, userMsg, trace)
  appendToSession(sessionId, assistantMsg, trace)

  return { decision: 'answer', reply: fullReply, trace }
}
