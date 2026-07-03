import { describe, it, expect } from 'vitest'
import { runRulesEngine } from './engine.ts'
import { makeCustomer, match, EU_OUTAGE, firedRule } from './test-fixtures.ts'

describe('runRulesEngine', () => {
  it('vipBillingRule: VIP + billing → escalate', () => {
    const { result, evaluations } = runRulesEngine({
      customer: makeCustomer({ customerId: 'vip-eu', tier: 'vip', region: 'eu' }),
      query: 'I have a billing dispute on my invoice',
      knowledgeMatches: [match('billing-dispute-escalation', 0.6)],
      activeIncidents: []
    })
    expect(result.action).toBe('escalate')
    expect(firedRule(evaluations)).toBe('vipBillingRule')
  })

  it('lowConfidenceRule: max KB score < 0.5 → escalate', () => {
    const { result, evaluations } = runRulesEngine({
      customer: makeCustomer({ customerId: 'smb-us', tier: 'smb' }),
      query: 'What is quantum entanglement?',
      knowledgeMatches: [match('laptop-desktop-troubleshooting', 0.2)],
      activeIncidents: []
    })
    expect(result.action).toBe('escalate')
    expect(firedRule(evaluations)).toBe('lowConfidenceRule')
  })

  it('regulatedTopicRule: GDPR keywords → answer', () => {
    const { result, evaluations } = runRulesEngine({
      customer: makeCustomer({ customerId: 'enterprise-eu', tier: 'enterprise', region: 'eu' }),
      query: 'What is your GDPR data retention policy?',
      knowledgeMatches: [match('gdpr-data-privacy-eu', 0.7)],
      activeIncidents: []
    })
    expect(result.action).toBe('answer')
    expect(firedRule(evaluations)).toBe('regulatedTopicRule')
  })

  it('knownOutageRule: outage keyword + KB match + active incident → route', () => {
    const { result, evaluations } = runRulesEngine({
      customer: makeCustomer(),
      query: 'Is ArkCloud EU down?',
      knowledgeMatches: [match('arkcloud-eu-outage', 0.6)],
      activeIncidents: [EU_OUTAGE]
    })
    expect(result.action).toBe('route')
    expect(firedRule(evaluations)).toBe('knownOutageRule')
  })

  it('knownOutageRule: does NOT fire when no incident is active', () => {
    const { evaluations } = runRulesEngine({
      customer: makeCustomer(),
      query: 'Is ArkCloud EU down?',
      knowledgeMatches: [match('arkcloud-eu-outage', 0.6)],
      activeIncidents: []
    })
    expect(firedRule(evaluations)).not.toBe('knownOutageRule')
  })

  it('refundEligibilityRule: refund keyword → answer', () => {
    const { result, evaluations } = runRulesEngine({
      customer: makeCustomer(),
      query: 'How do I return my laptop?',
      knowledgeMatches: [match('return-policy-us', 0.7)],
      activeIncidents: []
    })
    expect(result.action).toBe('answer')
    expect(firedRule(evaluations)).toBe('refundEligibilityRule')
  })

  it('refundEligibilityRule: carries the computed eligibility verdict in the fired evaluation metadata', () => {
    const { evaluations } = runRulesEngine({
      customer: makeCustomer({ customerId: 'consumer-eu', region: 'eu', purchaseDate: '2026-04-24' }),
      query: 'Can I get a refund?',
      knowledgeMatches: [match('return-policy-eu', 0.7)],
      activeIncidents: []
    })
    const fired = evaluations.find((e) => e.fired)
    expect(fired?.rule).toBe('refundEligibilityRule')
    // purchased well outside the EU 14-day window → deterministic verdict must be false, and it
    // must survive into the trace (RuleEvaluation.metadata), not just the reason string
    expect(fired?.metadata?.eligible).toBe(false)
  })

  it('first-match-wins: VIP billing beats selfServeBilling', () => {
    const { evaluations } = runRulesEngine({
      customer: makeCustomer({ tier: 'vip' }),
      query: 'question about my invoice charge',
      knowledgeMatches: [match('arkcloud-billing-faq', 0.6)],
      activeIncidents: []
    })
    expect(firedRule(evaluations)).toBe('vipBillingRule')
  })

  it('regression: unknown policy question is NOT classified as billing/self-serve', () => {
    const { evaluations } = runRulesEngine({
      customer: makeCustomer(), // non-VIP
      query: "What's your 90-day price-match guarantee?",
      knowledgeMatches: [match('arkcloud-billing-faq', 0.55)], // topically near, scores >= 0.5
      activeIncidents: []
    })
    expect(firedRule(evaluations)).not.toBe('selfServeBillingRule')
  })
})
