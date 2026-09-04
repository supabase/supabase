import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Command, CommandInput } from './command'

describe('CommandInput accessibility', () => {
  it('marks the search icon aria-hidden', () => {
    const { container } = render(
      <Command label="Search project">
        <CommandInput value="" onValueChange={() => {}} />
      </Command>
    )

    const icon = container.querySelector('[cmdk-input-wrapper] svg')
    expect(icon).toHaveAttribute('aria-hidden', 'true')
  })

  it('names the reset button "Clear search"', () => {
    render(
      <Command label="Search project">
        <CommandInput showResetIcon value="postgres" onValueChange={() => {}} />
      </Command>
    )

    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument()
  })
})
