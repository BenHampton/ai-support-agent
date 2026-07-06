import { describe, it, expect } from 'vitest'
import { sanitizeForDownstream } from './sanitize.ts'

const TAB = String.fromCharCode(9)
const NEWLINE = String.fromCharCode(10)
const BACKSPACE = String.fromCharCode(8)
const NUL = String.fromCharCode(0)

describe('sanitizeForDownstream', () => {
  it('HTML-encodes markup so an XSS payload cannot render as active elements', () => {
    const out = sanitizeForDownstream('billing dispute <img src=x onerror=alert(1)>')
    expect(out).not.toContain('<img')
    expect(out).not.toContain('<')
    expect(out).not.toContain('>')
    expect(out).toContain('&lt;img src=x onerror=alert(1)&gt;')
  })

  it('escapes ampersands, quotes, and apostrophes', () => {
    expect(sanitizeForDownstream(`Tom & "Jerry" O'Neil`)).toBe('Tom &amp; &quot;Jerry&quot; O&#39;Neil')
  })

  it('strips control characters but keeps tab/newline', () => {
    const input = 'a' + BACKSPACE + 'c' + NUL + TAB + 'd' + NEWLINE + 'e'
    expect(sanitizeForDownstream(input)).toBe('ac' + TAB + 'd' + NEWLINE + 'e')
  })

  it('caps length to bound the downstream payload', () => {
    const out = sanitizeForDownstream('x'.repeat(5000))
    expect(out.length).toBe(2000)
  })

  it('leaves ordinary text intact (modulo trim)', () => {
    expect(sanitizeForDownstream('  I have a billing question  ')).toBe('I have a billing question')
  })
})
