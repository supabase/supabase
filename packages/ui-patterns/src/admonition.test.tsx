import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Admonition, type AdmonitionProps } from './admonition'

const stringDescriptionProps = {
  description: 'Description-only copy.',
} satisfies AdmonitionProps

void stringDescriptionProps

describe('Admonition', () => {
  it('renders description-only content', () => {
    render(<Admonition type="default" description="Changes can take a few minutes to apply." />)

    expect(screen.getByRole('alert')).toHaveTextContent('Changes can take a few minutes to apply.')
  })

  it('renders children-only rich MDX-like content', () => {
    render(
      <Admonition type="note">
        <p>
          This is a Postgres{' '}
          <a href="/docs/guides/database/postgres/row-level-security">SECURITY DEFINER</a> function.
        </p>
        <ul>
          <li>Keep privileges scoped.</li>
        </ul>
      </Admonition>
    )

    const alert = screen.getByRole('alert')
    expect(within(alert).getByText('SECURITY DEFINER')).toHaveAttribute(
      'href',
      '/docs/guides/database/postgres/row-level-security'
    )
    expect(within(alert).getByText('Keep privileges scoped.')).toBeVisible()
  })

  it('renders title and description together', () => {
    render(
      <Admonition
        type="warning"
        title="Manual approval required"
        description="Review the pending changes before continuing."
      />
    )

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Manual approval required')
    expect(alert).toHaveTextContent('Review the pending changes before continuing.')
  })

  it('renders title and children together', () => {
    render(
      <Admonition type="caution" title="Security definer function">
        <p>Review ownership before exposing this function.</p>
      </Admonition>
    )

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Security definer function')
    expect(alert).toHaveTextContent('Review ownership before exposing this function.')
  })

  it('renders success state with success styling', () => {
    render(
      <Admonition
        type="success"
        title="Connection confirmed"
        description="You can now close this tab."
      />
    )

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Connection confirmed')
    expect(alert).toHaveTextContent('You can now close this tab.')
    expect(alert).toHaveClass('bg-brand-400/15')
    expect(alert).toHaveClass('border-brand-400')
    expect(alert.querySelector('svg path')?.getAttribute('d')).toContain('M10.5 19.5')
  })

  it('does not render the destructive icon when showIcon is false', () => {
    render(
      <Admonition
        type="destructive"
        showIcon={false}
        title="Deletion blocked"
        description="Resolve dependent resources before retrying."
      />
    )

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Deletion blocked')
    expect(alert.querySelector('svg')).not.toBeInTheDocument()
  })

  it('prefers title over legacy label when both are provided', () => {
    render(
      <Admonition
        type="note"
        label="Legacy heading"
        title="Preferred heading"
        description="Body copy."
      />
    )

    expect(screen.getByText('Preferred heading')).toBeVisible()
    expect(screen.queryByText('Legacy heading')).not.toBeInTheDocument()
  })
})
