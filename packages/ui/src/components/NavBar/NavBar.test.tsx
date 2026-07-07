import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { NavBar } from './NavBar'

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <NavBar />
    </MemoryRouter>
  )

describe('NavBar', () => {
  it('renders every route link', () => {
    renderAt('/')
    for (const name of ['Home', 'Chat', 'Logs', 'Tickets', 'Admin']) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument()
    }
  })

  it('marks the active route with aria-current', () => {
    renderAt('/admin')
    expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Chat' })).not.toHaveAttribute('aria-current')
  })
})
