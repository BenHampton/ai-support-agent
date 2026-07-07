import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AppTooltip } from './AppTooltip'

describe('AppTooltip', () => {
  it('renders its child', () => {
    render(
      <AppTooltip title="Hint">
        <button>Target</button>
      </AppTooltip>
    )
    expect(screen.getByRole('button', { name: 'Target' })).toBeInTheDocument()
  })

  it('does not show the tooltip until interaction', () => {
    render(
      <AppTooltip title="Hint">
        <button>Target</button>
      </AppTooltip>
    )
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('shows the title on hover', async () => {
    render(
      <AppTooltip title="Hint text">
        <button>Target</button>
      </AppTooltip>
    )
    fireEvent.mouseOver(screen.getByRole('button'))
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Hint text')
  })
})
