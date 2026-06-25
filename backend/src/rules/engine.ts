import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { parse } from 'yaml'
import type { Customer, KnowledgeMatch, RuleAction, RuleResult, RuleEvaluation } from '@shared/types'

const __dirname = dirname(fileURLToPath(import.meta.url))

type RuleConditions = {
  tier?: string
  excludeTier?: string
  keywordSet?: string
  maxScoreBelow?: number
  articleMatch?: { id: string; minScore: number }
  returnWindow?: boolean
}

type YamlRule = {
  name: string
  action: RuleAction
  conditions: RuleConditions
  metadata?: Record<string, unknown>
}

type RulesConfig = {
  keywords: Record<string, string[]>
  returnWindows: Record<string, number>
  rules: YamlRule[]
}

const config: RulesConfig = parse(
  readFileSync(join(__dirname, 'rules.yaml'), 'utf-8')
)

export type RuleContext = {
  customer: Customer
  query: string
  knowledgeMatches: KnowledgeMatch[]
}

// case-insensitive — lowercases before matching
const matchesAny = (text: string, keywords: string[]): boolean => {
  const lower = text.toLowerCase()
  return keywords.some((kw) => lower.includes(kw))
}

// returns 0 for empty matches — safe default so lowConfidenceRule triggers correctly
const maxScore = (matches: KnowledgeMatch[]): number =>
  matches.length === 0 ? 0 : Math.max(...matches.map((m) => m.score))

const daysSince = (dateStr: string): number => {
  const purchase = new Date(dateStr).getTime()
  const now = new Date().getTime()
  return Math.floor((now - purchase) / (1000 * 60 * 60 * 24))
}

const evaluateConditions = (
  conditions: RuleConditions,
  ctx: RuleContext
): { passed: boolean; metadata: Record<string, unknown> } => {
  const computed: Record<string, unknown> = {}

  if (conditions.tier && ctx.customer.tier !== conditions.tier) return { passed: false, metadata: {} }
  if (conditions.excludeTier && ctx.customer.tier === conditions.excludeTier) return { passed: false, metadata: {} }

  if (conditions.keywordSet) {
    const keywords = config.keywords[conditions.keywordSet] ?? []
    if (!matchesAny(ctx.query, keywords)) return { passed: false, metadata: {} }
  }

  if (conditions.maxScoreBelow !== undefined) {
    const score = maxScore(ctx.knowledgeMatches)
    if (score >= conditions.maxScoreBelow) return { passed: false, metadata: {} }
    computed['maxScore'] = score
  }

  if (conditions.articleMatch) {
    const { id, minScore } = conditions.articleMatch
    const match = ctx.knowledgeMatches.find((m) => m.articleId === id)
    if (!match || match.score < minScore) return { passed: false, metadata: {} }
  }

  if (conditions.returnWindow) {
    const windowDays = config.returnWindows[ctx.customer.region] ?? 30
    const age = daysSince(ctx.customer.purchaseDate)
    computed['eligible'] = age <= windowDays
    computed['purchasedDaysAgo'] = age
    computed['windowDays'] = windowDays
    computed['region'] = ctx.customer.region
  }

  return { passed: true, metadata: computed }
}

const buildReason = (rule: YamlRule, ctx: RuleContext, computed: Record<string, unknown>): string => {
  switch (rule.name) {
    case 'vipBillingRule':
      return 'VIP customer with billing topic — immediate human escalation required'
    case 'lowConfidenceRule':
      return `Low knowledge confidence (max score: ${(computed['maxScore'] as number).toFixed(3)}) — cannot reliably answer`
    case 'regulatedTopicRule':
      return 'Regulated topic detected — applying approved GDPR compliance language'
    case 'knownOutageRule':
      return 'Known ArkCloud EU outage detected — routing to incident macro'
    case 'refundEligibilityRule': {
      const { eligible, windowDays, purchasedDaysAgo } = computed as { eligible: boolean; windowDays: number; purchasedDaysAgo: number }
      return eligible
        ? `Customer is within the ${windowDays}-day return window (purchased ${purchasedDaysAgo} days ago)`
        : `Customer is outside the ${windowDays}-day return window (purchased ${purchasedDaysAgo} days ago)`
    }
    case 'selfServeBillingRule':
      return `Non-VIP billing question — directing to self-serve portal or CSM`
    default:
      return `Rule ${rule.name} matched`
  }
}

// evaluated in order — first match wins; order is defined in rules.yaml
export const runRulesEngine = (
  ctx: RuleContext
): { result: RuleResult; evaluations: RuleEvaluation[] } => {
  const evaluations: RuleEvaluation[] = []

  for (let i = 0; i < config.rules.length; i++) {
    const rule = config.rules[i]
    const { passed, metadata: computed } = evaluateConditions(rule.conditions, ctx)

    if (passed) {
      const reason = buildReason(rule, ctx, computed)
      evaluations.push({ rule: rule.name, fired: true, reason })
      for (let j = i + 1; j < config.rules.length; j++) {
        evaluations.push({ rule: config.rules[j].name, fired: false, reason: 'earlier rule matched' })
      }
      return {
        result: {
          action: rule.action,
          reason,
          metadata: { ...rule.metadata, ...computed }
        },
        evaluations
      }
    }

    evaluations.push({ rule: rule.name, fired: false, reason: 'conditions not met' })
  }

  return {
    result: { action: 'answer', reason: 'no rule matched — proceeding to LLM', metadata: {} },
    evaluations
  }
}
