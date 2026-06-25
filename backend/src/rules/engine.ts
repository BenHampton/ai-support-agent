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
  reason: string
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
    const match = ctx.knowledgeMatches.find((m) => m.kbMatchId === id)
    if (!match || match.score < minScore) return { passed: false, metadata: {} }
  }

  if (conditions.returnWindow) {
    const windowDays = config.returnWindows[ctx.customer.region] ?? 30
    const age = daysSince(ctx.customer.purchaseDate)
    const eligible = age <= windowDays
    computed['eligible'] = eligible
    computed['eligibleText'] = eligible ? 'within' : 'outside'
    computed['purchasedDaysAgo'] = age
    computed['windowDays'] = windowDays
    computed['region'] = ctx.customer.region
  }

  return { passed: true, metadata: computed }
}

// interpolates {key} tokens in the YAML reason string from computed metadata
const interpolateReason = (template: string, computed: Record<string, unknown>): string =>
  template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = computed[key]
    return typeof val === 'number' ? val.toFixed(3) : String(val ?? key)
  })

// evaluated in order — first match wins; order is defined in rules.yaml
export const runRulesEngine = (
  ctx: RuleContext
): { result: RuleResult; evaluations: RuleEvaluation[] } => {
  const evaluations: RuleEvaluation[] = []

  for (let i = 0; i < config.rules.length; i++) {
    const rule = config.rules[i]
    const { passed, metadata: computed } = evaluateConditions(rule.conditions, ctx)

    if (passed) {
      const reason = interpolateReason(rule.reason, computed)
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
