import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StatusBadge, type StatusBadgeStatus } from './index'

const statusBadgeExpectations: Array<{
  status: StatusBadgeStatus
  label: string
  tone: 'positive' | 'destructive' | 'neutral'
}> = [
  { status: 'success', label: 'Success', tone: 'positive' },
  { status: 'failure', label: 'Failure', tone: 'destructive' },
  { status: 'pending', label: 'Pending', tone: 'neutral' },
  { status: 'skipped', label: 'Skipped', tone: 'neutral' },
  { status: 'inactive', label: 'Inactive', tone: 'neutral' },
  { status: 'unknown', label: 'Unknown', tone: 'neutral' },
]

describe('StatusBadge', () => {
  it.each(statusBadgeExpectations)(
    'renders the default $label label for $status',
    ({ status, label }) => {
      render(<StatusBadge status={status} />)

      expect(screen.getByText(label)).toBeVisible()
    }
  )

  it.each(statusBadgeExpectations)(
    'applies the expected $tone tone and icon for $status',
    ({ status, label, tone }) => {
      render(<StatusBadge status={status} />)

      const root = screen.getByText(label).closest('[data-status]')

      expect(root).toHaveAttribute('data-status', status)
      expect(root).toHaveAttribute('data-tone', tone)
      expect(root?.querySelector('[data-slot="status-badge-icon"] svg')).toBeInTheDocument()
    }
  )

  it('allows children to override the rendered label without changing the semantic styling', () => {
    render(<StatusBadge status="pending">Retrying</StatusBadge>)

    const root = screen.getByText('Retrying').closest('[data-status]')

    expect(screen.getByText('Retrying')).toBeVisible()
    expect(screen.queryByText('Pending')).not.toBeInTheDocument()
    expect(root).toHaveAttribute('data-status', 'pending')
    expect(root).toHaveAttribute('data-tone', 'neutral')
  })

  it('passes className through to the root and keeps the badge non-wrapping', () => {
    render(<StatusBadge status="inactive" className="test-class" />)

    const root = screen.getByText('Inactive').closest('[data-status]')

    expect(root).toHaveClass('test-class')
    expect(root).toHaveClass('whitespace-nowrap')
  })
})
