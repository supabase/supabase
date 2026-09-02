import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Admonition, type AdmonitionProps } from './index'

const stringDescriptionProps = {
  description: 'Description-only copy.',
} satisfies AdmonitionProps

const invalidLabelProps = {
  // @ts-expect-error label was removed; use title instead.
  label: 'Legacy heading',
  description: 'Body copy.',
} satisfies AdmonitionProps

void stringDescriptionProps
void invalidLabelProps

describe('Admonition', () => {
  it('renders description-only content without a visible type label', () => {
    render(<Admonition type="default" description="Changes can take a few minutes to apply." />)

    const note = screen.getByRole('alert', { name: 'Note' })
    expect(within(note).queryByText('Note:')).not.toBeInTheDocument()
    expect(note).toHaveTextContent('Changes can take a few minutes to apply.')
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

    const note = screen.getByRole('alert', { name: 'Note' })
    expect(within(note).queryByText('Note:')).not.toBeInTheDocument()
    expect(within(note).getByText('SECURITY DEFINER')).toHaveAttribute(
      'href',
      '/docs/guides/database/postgres/row-level-security'
    )
    expect(within(note).getByText('Keep privileges scoped.')).toBeVisible()
  })

  it('renders a title and description without a type label', () => {
    render(
      <Admonition
        type="warning"
        title="Manual approval required"
        description="Review the pending changes before continuing."
      />
    )

    const note = screen.getByRole('alert', { name: 'Warning' })
    expect(within(note).queryByText('Warning:')).not.toBeInTheDocument()
    expect(note).toHaveTextContent('Manual approval required')
    expect(note.querySelector('h1, h2, h3, h4, h5, h6')).not.toBeInTheDocument()
    expect(note).toHaveTextContent('Review the pending changes before continuing.')
  })

  it('renders a title with children', () => {
    render(
      <Admonition type="caution" title="Security definer function">
        <p>Review ownership before exposing this function.</p>
      </Admonition>
    )

    const note = screen.getByRole('alert', { name: 'Caution' })
    expect(within(note).queryByText('Caution:')).not.toBeInTheDocument()
    expect(note).toHaveTextContent('Security definer function')
    expect(note.querySelector('h1, h2, h3, h4, h5, h6')).not.toBeInTheDocument()
    expect(note).toHaveTextContent('Review ownership before exposing this function.')
  })

  it('renders success styling', () => {
    render(
      <Admonition
        type="success"
        title="Connection confirmed"
        description="You can now close this tab."
      />
    )

    const note = screen.getByRole('alert', { name: 'Success' })
    expect(note).toHaveTextContent('Connection confirmed')
    expect(note).toHaveTextContent('You can now close this tab.')
    expect(note).toHaveClass('bg-brand-400/15')
    expect(note).toHaveClass('border-brand-400')
    expect(note.querySelector('svg path')?.getAttribute('d')).toContain('M10.5 19.5')
  })

  it('omits the icon when showIcon is false', () => {
    render(
      <Admonition
        type="destructive"
        showIcon={false}
        title="Deletion blocked"
        description="Resolve dependent resources before retrying."
      />
    )

    const note = screen.getByRole('alert', { name: 'Danger' })
    expect(note).toHaveTextContent('Deletion blocked')
    expect(note.querySelector('svg')).not.toBeInTheDocument()
  })

  it.each([
    ['danger', 'Danger'],
    ['deprecation', 'Deprecated'],
  ] as const)('exposes %s via aria-label as %s', (type, name) => {
    render(<Admonition type={type} description="Body copy." />)

    expect(screen.getByRole('alert', { name })).toBeVisible()
    expect(within(screen.getByRole('alert')).queryByText(`${name}:`)).not.toBeInTheDocument()
  })

  it('renders the title via AlertTitle (paragraph, not a heading)', () => {
    render(<Admonition type="note" title="Manual approval required" description="Body copy." />)

    const note = screen.getByRole('alert', { name: 'Note' })
    const title = within(note).getByText('Manual approval required')

    expect(note.querySelector('h1, h2, h3, h4, h5, h6')).not.toBeInTheDocument()
    expect(title.tagName).toBe('P')
    expect(title).toHaveAttribute('data-slot', 'alert-title')
    expect(title).toHaveClass('!mt-0', 'mb-0.5', 'font-medium')
  })

  it('wraps a string description in a paragraph', () => {
    render(<Admonition type="note" description="Body copy." />)

    const note = screen.getByRole('alert', { name: 'Note' })
    const description = within(note).getByText('Body copy.')

    expect(description.tagName).toBe('P')
    expect(description.parentElement).toHaveClass('mb-0')
  })

  it('wraps MDX children in AlertDescription', () => {
    render(
      <Admonition type="note">
        <p>Children body copy.</p>
      </Admonition>
    )

    const note = screen.getByRole('alert', { name: 'Note' })
    const paragraph = within(note).getByText('Children body copy.')

    expect(paragraph.tagName).toBe('P')
    expect(paragraph.parentElement).toHaveClass('mb-0')
    expect(paragraph.parentElement).toHaveAttribute('data-slot', 'alert-description')
  })

  it('only offsets content when there is an icon to align against', () => {
    const { rerender } = render(<Admonition type="note" description="Body copy." />)

    const wrapper = () =>
      screen.getByRole('alert', { name: 'Note' }).querySelector('[data-slot="alert-description"]')
        ?.parentElement

    expect(wrapper()?.className).not.toBe('')

    rerender(<Admonition type="note" showIcon={false} description="Body copy." />)

    expect(wrapper()?.className).toBe('')
  })
})
