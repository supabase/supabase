import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StateBadge, type StateBadgeState } from './index'

const stateBadgeExpectations: Array<{
  state: StateBadgeState
  label: string
  tone: 'positive' | 'neutral'
}> = [
  { state: 'enabled', label: 'Enabled', tone: 'positive' },
  { state: 'disabled', label: 'Disabled', tone: 'neutral' },
]

describe('StateBadge', () => {
  it.each(stateBadgeExpectations)(
    'renders the default $label label for $state',
    ({ state, label }) => {
      render(<StateBadge state={state} />)

      expect(screen.getByText(label)).toBeVisible()
    }
  )

  it.each(stateBadgeExpectations)(
    'applies the expected $tone tone and icon for $state',
    ({ state, label, tone }) => {
      render(<StateBadge state={state} />)

      const root = screen.getByText(label).closest('[data-state]')

      expect(root).toHaveAttribute('data-state', state)
      expect(root).toHaveAttribute('data-tone', tone)
      expect(root?.querySelector('[data-slot="state-badge-icon"]')).toBeInTheDocument()
    }
  )

  it('allows children to override the rendered label without changing the semantic styling', () => {
    render(<StateBadge state="enabled">Active</StateBadge>)

    const root = screen.getByText('Active').closest('[data-state]')

    expect(screen.getByText('Active')).toBeVisible()
    expect(screen.queryByText('Enabled')).not.toBeInTheDocument()
    expect(root).toHaveAttribute('data-state', 'enabled')
    expect(root).toHaveAttribute('data-tone', 'positive')
  })

  it('passes className through to the root and keeps the badge non-wrapping', () => {
    render(<StateBadge state="enabled" className="test-class" />)

    const root = screen.getByText('Enabled').closest('[data-state]')

    expect(root).toHaveClass('test-class')
    expect(root).toHaveClass('whitespace-nowrap')
    expect(root?.querySelector('[data-slot="state-badge-icon"]')).toBeInTheDocument()
  })
})
