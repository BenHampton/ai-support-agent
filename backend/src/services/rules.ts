import type { Customer, KnowledgeMatch, RuleResult, RuleEvaluation } from '@shared/types'

export type RuleContext = {
  customer: Customer
  query: string
  knowledgeMatches: KnowledgeMatch[]
}

type RuleFunction = (ctx: RuleContext) => RuleResult | null

const BILLING_KEYWORDS = [
  'billing', 'bill', 'invoice', 'charge', 'payment', 'subscription',
  'dispute', 'refund', 'credit', 'overcharge', 'debit', 'fee', 'cost', 'price'
]

const OUTAGE_KEYWORDS = [
  'outage', 'down', 'offline', 'unavailable', 'not working', 'disruption',
  'incident', 'latency', 'degraded', 'degradation', 'slow', 'unreachable', 'timeout'
]

const GDPR_KEYWORDS = [
  'gdpr', 'privacy', 'data retention', 'erasure', 'data protection',
  'personal data', 'compliance', 'regulation', 'legal', 'dpo', 'right to', 'opt out'
]

const REFUND_KEYWORDS = [
  'refund', 'return', 'send back', 'money back', 'exchange', 'give back', 'cancel order'
]

// case-insensitive — lowercases before matching
const matchesAny = (text: string, keywords: string[]): boolean => {
  const lower = text.toLowerCase()
  return keywords.some((kw) => lower.includes(kw))
}

// returns 0 for empty matches — safe default so lowConfidenceRule triggers correctly
const maxScore = (matches: KnowledgeMatch[]): number =>
  matches.length === 0 ? 0 : Math.max(...matches.map((m) => m.score))

// EU: 14-day statutory right of return; US: 30-day Ark Systems policy
const RETURN_WINDOW_DAYS: Record<string, number> = { us: 30, eu: 14 }

const daysSince = (dateStr: string): number => {
  const purchase = new Date(dateStr).getTime()
  const now = new Date().getTime()
  return Math.floor((now - purchase) / (1000 * 60 * 60 * 24))
}

const vipBillingRule: RuleFunction = (ctx) => {
  if (ctx.customer.tier !== 'vip') return null
  if (!matchesAny(ctx.query, BILLING_KEYWORDS)) return null
  return {
    action: 'escalate',
    reason: 'VIP customer with billing topic — immediate human escalation required',
    metadata: { priority: 'urgent', tier: 'vip' }
  }
}

const lowConfidenceRule: RuleFunction = (ctx) => {
  if (maxScore(ctx.knowledgeMatches) >= 0.4) return null
  return {
    action: 'escalate',
    reason: `Low knowledge confidence (max score: ${maxScore(ctx.knowledgeMatches).toFixed(3)}) — cannot reliably answer`,
    metadata: { priority: 'normal', maxScore: maxScore(ctx.knowledgeMatches) }
  }
}

const regulatedTopicRule: RuleFunction = (ctx) => {
  if (!matchesAny(ctx.query, GDPR_KEYWORDS)) return null
  return {
    action: 'answer',
    reason: 'Regulated topic detected — applying approved GDPR compliance language',
    metadata: { requiresComplianceLanguage: true, region: ctx.customer.region }
  }
}

const knownOutageRule: RuleFunction = (ctx) => {
  if (!matchesAny(ctx.query, OUTAGE_KEYWORDS)) return null
  const outageArticle = ctx.knowledgeMatches.find((m) => m.articleId === 'arkcloud-eu-outage')
  if (!outageArticle || outageArticle.score < 0.3) return null
  return {
    action: 'route',
    reason: 'Known ArkCloud EU outage detected — routing to incident macro',
    metadata: {
      macro: 'arkcloud-eu-outage',
      response: `We are aware of an active incident affecting ArkCloud EU-WEST-1 and EU-CENTRAL-1 regions. Our infrastructure team is working on a fix with an ETA of 20:30 UTC today.\n\nWorkaround: If you have a multi-region setup, you can redirect traffic to EU-NORTH-1 or US-EAST-1 via ArkCloud Console → Settings → Region Preferences.\n\nAll affected customers will receive automatic SLA credits. Monitor real-time status at status.arksystems.com.\n\nWe apologize for the inconvenience.`
    }
  }
}

const refundEligibilityRule: RuleFunction = (ctx) => {
  if (!matchesAny(ctx.query, REFUND_KEYWORDS)) return null
  const windowDays = RETURN_WINDOW_DAYS[ctx.customer.region] ?? 30
  const age = daysSince(ctx.customer.purchaseDate)
  const eligible = age <= windowDays

  return {
    action: 'answer',
    reason: eligible
      ? `Customer is within the ${windowDays}-day return window (purchased ${age} days ago)`
      : `Customer is outside the ${windowDays}-day return window (purchased ${age} days ago)`,
    metadata: { eligible, purchasedDaysAgo: age, windowDays, region: ctx.customer.region }
  }
}

const selfServeBillingRule: RuleFunction = (ctx) => {
  if (ctx.customer.tier === 'vip') return null
  if (!matchesAny(ctx.query, BILLING_KEYWORDS)) return null
  return {
    action: 'answer',
    reason: 'Non-VIP billing question — directing to self-serve portal or CSM',
    metadata: { tier: ctx.customer.tier, selfServeEligible: ctx.customer.tier !== 'enterprise' }
  }
}

// evaluated in order — first match wins; ordering is intentional
const RULES: { name: string; fn: RuleFunction }[] = [
  { name: 'vipBillingRule', fn: vipBillingRule },
  { name: 'lowConfidenceRule', fn: lowConfidenceRule },
  { name: 'regulatedTopicRule', fn: regulatedTopicRule },
  { name: 'knownOutageRule', fn: knownOutageRule },
  { name: 'refundEligibilityRule', fn: refundEligibilityRule },
  { name: 'selfServeBillingRule', fn: selfServeBillingRule }
]

export const evaluateRules = (
  ctx: RuleContext
): { result: RuleResult; evaluations: RuleEvaluation[] } => {
  const evaluations: RuleEvaluation[] = []

  for (let i = 0; i < RULES.length; i++) {
    const { name, fn } = RULES[i]
    const result = fn(ctx)
    if (result) {
      evaluations.push({ rule: name, fired: true, reason: result.reason })
      // record skipped rules so the trace is complete even when they weren't evaluated
      for (let j = i + 1; j < RULES.length; j++) {
        evaluations.push({ rule: RULES[j].name, fired: false, reason: 'earlier rule matched' })
      }
      return { result, evaluations }
    }
    evaluations.push({ rule: name, fired: false, reason: 'conditions not met' })
  }

  return {
    result: { action: 'answer', reason: 'no rule matched — proceeding to LLM', metadata: {} },
    evaluations
  }
}
