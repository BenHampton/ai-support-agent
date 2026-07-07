import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { AppSelectOptions } from './AppSelectOptions'

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' }
]

describe('AppSelectOptions', () => {
  it('renders the selected option label', () => {
    render(<AppSelectOptions value="a" onChange={() => {}} options={options} ariaLabel="Letter" />)
    expect(screen.getByText('Alpha')).toBeInTheDocument()
  })

  it('exposes the aria label on the combobox', () => {
    render(<AppSelectOptions value="a" onChange={() => {}} options={options} ariaLabel="Letter" />)
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-label', 'Letter')
  })

  it('falls back to the value when an option has no label', () => {
    render(<AppSelectOptions value="x" onChange={() => {}} options={[{ value: 'x' }]} ariaLabel="Letter" />)
    expect(screen.getByText('x')).toBeInTheDocument()
  })

  it('calls onChange with the chosen value', () => {
    const onChange = vi.fn()
    render(<AppSelectOptions value="a" onChange={onChange} options={options} ariaLabel="Letter" />)
    fireEvent.mouseDown(screen.getByRole('combobox'))
    const listbox = screen.getByRole('listbox')
    fireEvent.click(within(listbox).getByText('Beta'))
    expect(onChange).toHaveBeenCalledWith('b')
  })
})
