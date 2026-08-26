import { screen, within } from '@testing-library/react'
import { Command } from 'ui'
import { describe, expect, it } from 'vitest'

import { CommandItemLink } from './CommandItemLink'
import { render } from '@/tests/helpers'

describe('CommandItemLink', () => {
  it('wraps the command item in a link', () => {
    render(
      <Command>
        <CommandItemLink href="/destination">Destination</CommandItemLink>
      </Command>
    )

    const link = screen.getByRole('link', { name: 'Destination' })
    expect(within(link).getByRole('option')).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/destination')
  })

  it('does not render disabled command items as links', () => {
    render(
      <Command>
        <CommandItemLink href="/destination" disabled>
          Destination
        </CommandItemLink>
      </Command>
    )

    expect(screen.queryByRole('link', { name: 'Destination' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Destination' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })
})
