import { describe, it, expect } from 'vitest'
import type { RuleResult } from '@shared/types'
import { buildSystemPrompt } from './orchestration.ts'
import { makeCustomer } from '../rules/test-fixtures.ts'

// The rules engine computes refund eligibility deterministically (engine.ts returnWindow logic).
// The prompt must carry that verdict authoritatively so the LLM states it, rather than re-deriving
// it from the KB (with no purchaseDate) and potentially contradicting the engine.
// Empty knowledgeMatches keep this deterministic — no embeddings, no Ollama.

const refundResult = (metadata: RuleResult['metadata']): RuleResult => ({
  action: 'answer',
  reason: 'refund eligibility',
  metadata
})

describe('buildSystemPrompt — refund eligibility enforcement', () => {
  it('injects an authoritative NOT ELIGIBLE determination for an out-of-window EU customer', () => {
    const prompt = buildSystemPrompt(
      makeCustomer({ customerId: 'consumer-eu', region: 'eu', purchaseDate: '2026-04-24' }),
      [],
      [],
      refundResult({ eligible: false, purchasedDaysAgo: 70, windowDays: 14, region: 'eu' })
    )
    expect(prompt).toContain('<eligibility>')
    expect(prompt).toMatch(/NOT ELIGIBLE/)
    expect(prompt).toContain('70')
    expect(prompt).toContain('14')
  })

  it('injects an authoritative ELIGIBLE determination for an in-window customer', () => {
    const prompt = buildSystemPrompt(
      makeCustomer({ customerId: 'consumer-us', region: 'us' }),
      [],
      [],
      refundResult({ eligible: true, purchasedDaysAgo: 5, windowDays: 30, region: 'us' })
    )
    expect(prompt).toContain('<eligibility>')
    expect(prompt).toMatch(/\bELIGIBLE\b/)
    expect(prompt).not.toMatch(/NOT ELIGIBLE/)
  })

  it('omits the eligibility block when the fired rule computed no verdict', () => {
    const prompt = buildSystemPrompt(makeCustomer(), [], [], refundResult({}))
    expect(prompt).not.toContain('<eligibility>')
  })
})
