import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AppButton } from './AppButton'

describe('AppButton', () => {
  it('renders its children', () => {
    render(<AppButton>Click me</AppButton>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('fires onClick when clicked', () => {
    const onClick = vi.fn()
    render(<AppButton onClick={onClick}>Go</AppButton>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not fire onClick when disabled', () => {
    const onClick = vi.fn()
    render(
      <AppButton onClick={onClick} disabled>
        Go
      </AppButton>
    )
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    fireEvent.click(btn)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('defaults to type="button"', () => {
    render(<AppButton>Go</AppButton>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('applies a different class per variant', () => {
    const { container: p } = render(<AppButton variant="primary">P</AppButton>)
    const { container: s } = render(<AppButton variant="subtle">S</AppButton>)
    expect(p.querySelector('button')!.className).not.toBe(s.querySelector('button')!.className)
  })
})
