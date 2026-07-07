import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppAlert } from './AppAlert'

describe('AppAlert', () => {
  it('renders its message with alert semantics', () => {
    render(<AppAlert severity="error">Something broke</AppAlert>)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Something broke')
  })

  it('applies a different class per severity', () => {
    const { container: err } = render(<AppAlert severity="error">e</AppAlert>)
    const { container: info } = render(<AppAlert severity="info">i</AppAlert>)
    expect(err.querySelector('[role="alert"]')!.className).not.toBe(
      info.querySelector('[role="alert"]')!.className
    )
  })
})
