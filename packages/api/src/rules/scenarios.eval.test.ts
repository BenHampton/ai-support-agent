import { describe, it, expect, afterAll } from 'vitest'
import type { Customer, Decision, Incident, KnowledgeBaseMatch } from '@shared/types'
import { runRulesEngine } from './engine.ts'
import { makeCustomer, match, EU_OUTAGE, firedRule } from './test-fixtures.ts'

// Eval harness: declarative scenarios -> expected decision + fired rule.
// Deterministic (engine level, hand-authored knowledgeMatches — no embedding, no Ollama).
// Add a new red-team finding by appending one row.

type Scenario = {
  name: string
  customer: Customer
  query: string
  knowledgeMatches: KnowledgeBaseMatch[]
  activeIncidents: Incident[]
  expect: { decision: Decision; rule: string | null }
}

const SCENARIOS: Scenario[] = [
  {
    name: 'consumer-us · "How do I return my laptop?" → answer/refundEligibility',
    customer: makeCustomer({ customerId: 'consumer-us' }),
    query: 'How do I return my laptop?',
    knowledgeMatches: [match('return-policy-us', 0.7)],
    activeIncidents: [],
    expect: { decision: 'answer', rule: 'refundEligibilityRule' }
  },
  {
    name: 'vip-eu · "billing dispute on my invoice" → escalate/vipBilling',
    customer: makeCustomer({ customerId: 'vip-eu', tier: 'vip', region: 'eu' }),
    query: 'I have a billing dispute on my invoice',
    knowledgeMatches: [match('billing-dispute-escalation', 0.6)],
    activeIncidents: [],
    expect: { decision: 'escalate', rule: 'vipBillingRule' }
  },
  {
    name: 'smb-us · "What is quantum entanglement?" → escalate/lowConfidence',
    customer: makeCustomer({ customerId: 'smb-us', tier: 'smb' }),
    query: 'What is quantum entanglement?',
    knowledgeMatches: [match('laptop-desktop-troubleshooting', 0.2)],
    activeIncidents: [],
    expect: { decision: 'escalate', rule: 'lowConfidenceRule' }
  },
  {
    name: 'enterprise-eu · "GDPR data retention policy?" → answer/regulatedTopic',
    customer: makeCustomer({ customerId: 'enterprise-eu', tier: 'enterprise', region: 'eu' }),
    query: 'What is your GDPR data retention policy?',
    knowledgeMatches: [match('gdpr-data-privacy-eu', 0.7)],
    activeIncidents: [],
    expect: { decision: 'answer', rule: 'regulatedTopicRule' }
  },
  {
    name: 'consumer-us · "Is ArkCloud EU down?" → route/knownOutage',
    customer: makeCustomer({ customerId: 'consumer-us' }),
    query: 'Is ArkCloud EU down?',
    knowledgeMatches: [match('arkcloud-eu-outage', 0.6)],
    activeIncidents: [EU_OUTAGE],
    expect: { decision: 'route', rule: 'knownOutageRule' }
  },
  {
    name: 'consumer-us · "Can I get a refund?" → answer/refundEligibility',
    customer: makeCustomer({ customerId: 'consumer-us' }),
    query: 'Can I get a refund?',
    knowledgeMatches: [match('return-policy-us', 0.7)],
    activeIncidents: [],
    expect: { decision: 'answer', rule: 'refundEligibilityRule' }
  },
  {
    // red-team finding: "price" alone must not classify an unknown-policy question as billing
    name: 'consumer-us · "90-day price-match guarantee?" → not billing/self-serve',
    customer: makeCustomer({ customerId: 'consumer-us' }),
    query: "What's your 90-day price-match guarantee?",
    knowledgeMatches: [match('arkcloud-billing-faq', 0.55)],
    activeIncidents: [],
    expect: { decision: 'answer', rule: null }
  }
]

const scorecard: { name: string; pass: boolean }[] = []

describe('rules eval harness', () => {
  it.each(SCENARIOS)('$name', (s) => {
    const { result, evaluations } = runRulesEngine({
      customer: s.customer,
      query: s.query,
      knowledgeMatches: s.knowledgeMatches,
      activeIncidents: s.activeIncidents
    })
    const actual = { decision: result.action, rule: firedRule(evaluations) ?? null }
    scorecard.push({ name: s.name, pass: actual.decision === s.expect.decision && actual.rule === s.expect.rule })
    expect(actual).toEqual(s.expect)
  })

  afterAll(() => {
    const passed = scorecard.filter((r) => r.pass).length
    const lines = scorecard.map((r) => `  ${r.pass ? '✓' : '✗'} ${r.name}`).join('\n')
    console.log(`\nEval scorecard: ${passed}/${scorecard.length} passed\n${lines}\n`)
  })
})
