import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ContextBadge } from './index'

describe('ContextBadge', () => {
  it('preserves the uppercase capsule styling', () => {
    render(<ContextBadge>Production</ContextBadge>)

    const badge = screen.getByText('Production')

    expect(badge).toHaveClass('rounded-full')
    expect(badge).toHaveClass('uppercase')
    expect(badge).toHaveClass('tracking-[0.07em]')
  })

  it('keeps the legacy variants', () => {
    render(
      <div>
        <ContextBadge variant="default">Default</ContextBadge>
        <ContextBadge variant="warning">Warning</ContextBadge>
        <ContextBadge variant="success">Success</ContextBadge>
        <ContextBadge variant="destructive">Destructive</ContextBadge>
      </div>
    )

    expect(screen.getByText('Default')).toHaveClass('border-strong')
    expect(screen.getByText('Warning')).toHaveClass('border-warning-500')
    expect(screen.getByText('Success')).toHaveClass('border-brand-500')
    expect(screen.getByText('Destructive')).toHaveClass('border-destructive-500')
  })
})
