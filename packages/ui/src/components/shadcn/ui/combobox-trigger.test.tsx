import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ComboboxTrigger } from './combobox-trigger'
import { Select, SelectTrigger, SelectValue } from './select'

describe('ComboboxTrigger', () => {
  it('shares the raised surface with SelectTrigger', () => {
    render(<ComboboxTrigger aria-expanded={false}>Select publication</ComboboxTrigger>)

    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveTextContent('Select publication')
    expect(trigger).toHaveClass(
      'bg-card',
      'border-0',
      'shadow-[var(--button-shadow-default)]',
      'cursor-pointer',
      'focus-ring',
      'text-left'
    )
    expect(trigger.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('uses the same surface on SelectTrigger', () => {
    render(
      <Select defaultValue="first">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
      </Select>
    )

    expect(screen.getByRole('combobox')).toHaveClass(
      'bg-card',
      'border-0',
      'shadow-[var(--button-shadow-default)]'
    )
  })
})
