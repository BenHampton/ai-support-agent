import type {
  Customer,
  Decision,
  DecisionTrace,
  KnowledgeBaseMatch,
  Message,
  RuleEvaluation
} from '@shared/types'
import { getOrCreateSession, appendTurn } from '../../store/sessions.ts'

type BaseTrace = Omit<DecisionTrace, 'decision' | 'zendeskTicketId' | 'llmPrompt' | 'latencyMs'>

type CommitParams = {
  userMessage: string
  reply: string
  decision: Decision
  zendeskTicketId?: string
  llmPrompt?: string
}

// Owns a single request's DecisionTrace lifecycle: generates the messageId, times the request, assembles
// the trace, builds the user+assistant turn, and persists it via the session store. All base data is known
// before the pipeline branches, so it's a construct-then-commit shape — one commit() call per outcome.
export class Tracer {
  readonly messageId: string
  private readonly startTime: number
  private readonly sessionId: string
  private readonly base: BaseTrace

  constructor(
    sessionId: string,
    customer: Customer,
    knowledgeMatches: KnowledgeBaseMatch[],
    rulesEvaluated: RuleEvaluation[]
  ) {
    this.startTime = Date.now()
    this.messageId = `msg-${this.startTime}-${Math.random().toString(36).slice(2, 7)}`
    this.sessionId = sessionId
    getOrCreateSession(sessionId, customer.customerId)
    this.base = {
      sessionId,
      messageId: this.messageId,
      timestamp: new Date(this.startTime).toISOString(),
      customerContext: {
        customerId: customer.customerId,
        tier: customer.tier,
        region: customer.region,
        accountStatus: customer.accountStatus
      },
      knowledgeMatches,
      rulesEvaluated
    }
  }

  // Finalize the trace for this request's outcome, persist the turn (user + assistant messages + trace),
  // and return the trace. latencyMs is measured from construction to here.
  commit({ userMessage, reply, decision, zendeskTicketId, llmPrompt }: CommitParams): DecisionTrace {
    const trace: DecisionTrace = {
      ...this.base,
      decision,
      zendeskTicketId,
      llmPrompt,
      latencyMs: Date.now() - this.startTime
    }
    const timestamp = new Date().toISOString()
    const userMsg: Message = { id: `${this.messageId}-u`, role: 'user', content: userMessage, timestamp }
    const assistantMsg: Message = {
      id: `${this.messageId}-a`,
      role: 'assistant',
      content: reply,
      timestamp,
      trace
    }
    appendTurn(this.sessionId, [userMsg, assistantMsg], trace)
    return trace
  }
}
