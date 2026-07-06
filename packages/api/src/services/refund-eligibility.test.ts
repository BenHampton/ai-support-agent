import { describe, it, expect } from 'vitest'
import type { RuleResult } from '@shared/types'
import { formatRefundEligibilityVerdict } from './refund-eligibility.ts'
import { makeCustomer } from '../rules/test-fixtures.ts'

// The verdict is owned by code (not the LLM). These lock in the exact customer-facing wording the
// orchestrator emits before any model call, so a prompt injection can't change the outcome.

const refundResult = (metadata: RuleResult['metadata']): RuleResult => ({
  action: 'answer',
  reason: 'refund eligibility',
  metadata
})

describe('formatRefundEligibilityVerdict', () => {
  it('renders an ELIGIBLE verdict for an in-window customer', () => {
    const verdict = formatRefundEligibilityVerdict(
      refundResult({ eligible: true, purchasedDaysAgo: 5, windowDays: 30, region: 'us' }),
      makeCustomer({ region: 'us' })
    )
    expect(verdict).toContain('you are eligible for a refund')
    expect(verdict).toContain('5 days ago')
    expect(verdict).toContain('US 30-day return window')
    expect(verdict).not.toContain('not eligible')
  })

  it('renders a NOT-ELIGIBLE verdict for an out-of-window customer', () => {
    const verdict = formatRefundEligibilityVerdict(
      refundResult({ eligible: false, purchasedDaysAgo: 70, windowDays: 14, region: 'eu' }),
      makeCustomer({ region: 'eu' })
    )
    expect(verdict).toContain('you are not eligible for a standard refund')
    expect(verdict).toContain('70 days ago')
    expect(verdict).toContain('EU 14-day return window')
  })

  it('returns an empty string when the fired rule computed no verdict', () => {
    expect(formatRefundEligibilityVerdict(refundResult({}), makeCustomer())).toBe('')
  })
})
