import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Badge } from './badge'

describe('Badge', () => {
  it('renders the neutral chip base styling', () => {
    render(<Badge>Metadata</Badge>)

    const badge = screen.getByText('Metadata')

    expect(badge).toHaveClass('rounded-md')
    expect(badge).not.toHaveClass('uppercase')
    expect(badge).toHaveClass('whitespace-nowrap')
  })

  it('keeps variant support', () => {
    render(
      <div>
        <Badge variant="default">Default</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="secondary">Secondary</Badge>
      </div>
    )

    expect(screen.getByText('Default')).toHaveClass('bg-surface-100')
    expect(screen.getByText('Warning')).toHaveClass('border-warning-500')
    expect(screen.getByText('Success')).toHaveClass('border-brand-500')
    expect(screen.getByText('Destructive')).toHaveClass('border-destructive-500')
    expect(screen.getByText('Secondary')).toHaveClass('border-transparent')
  })
})
