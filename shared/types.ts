export type CustomerTier = 'consumer' | 'smb' | 'enterprise' | 'vip'

export type Region = 'us' | 'eu'

export type AccountStatus = 'active' | 'suspended' | 'churned'

export type RuleAction = 'answer' | 'escalate' | 'route'

export type Decision = 'answer' | 'escalate' | 'route'

export type Customer = {
  customerId: string
  name: string
  tier: CustomerTier
  region: Region
  accountStatus: AccountStatus
  products: string[]
  purchaseDate: string
  entitlements: string[]
}

export type KnowledgeArticle = {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
}

export type KnowledgeMatch = {
  kbMatchId: string
  score: number
  snippet: string
}

export type RuleResult = {
  action: RuleAction
  reason: string
  metadata: Record<string, unknown>
}

export type RuleEvaluation = {
  rule: string
  fired: boolean
  reason: string
}

export type ZendeskTicket = {
  id: string
  customerId: string
  sessionId: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  reason: string
  conversationContext: string
  createdAt: string
}

// Central audit record — emitted on every pipeline step regardless of outcome
export type DecisionTrace = {
  sessionId: string
  messageId: string
  timestamp: string
  customerContext: {
    customerId: string
    tier: CustomerTier
    region: Region
    accountStatus: AccountStatus
  }
  knowledgeMatches: KnowledgeMatch[]
  rulesEvaluated: RuleEvaluation[]
  decision: Decision
  zendeskTicketId?: string
  llmPrompt?: string
  latencyMs: number
}

export type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  trace?: DecisionTrace
}

export type AppError = {
  code: string
  message: string
  statusCode: number
}
