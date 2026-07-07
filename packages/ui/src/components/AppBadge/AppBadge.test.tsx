import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppBadge } from './AppBadge'

describe('AppBadge', () => {
  it('renders its label', () => {
    render(<AppBadge tone="answer">answer</AppBadge>)
    expect(screen.getByText('answer')).toBeInTheDocument()
  })

  it('renders as a span', () => {
    render(<AppBadge tone="answer">x</AppBadge>)
    expect(screen.getByText('x').tagName).toBe('SPAN')
  })

  it('applies a different class per tone', () => {
    const { container: a } = render(<AppBadge tone="answer">a</AppBadge>)
    const { container: b } = render(<AppBadge tone="escalate">b</AppBadge>)
    expect(a.querySelector('span')!.className).not.toBe(b.querySelector('span')!.className)
  })

  it('drops the uppercase class when uppercase is false', () => {
    const { container: on } = render(<AppBadge tone="answer">a</AppBadge>)
    const { container: off } = render(
      <AppBadge tone="answer" uppercase={false}>
        a
      </AppBadge>
    )
    expect(on.querySelector('span')!.className).not.toBe(off.querySelector('span')!.className)
  })
})
