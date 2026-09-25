import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ComboboxTrigger } from './select-trigger'

describe('ComboboxTrigger', () => {
  it('matches the raised select trigger styling', () => {
    render(<ComboboxTrigger aria-expanded={false}>Select publication</ComboboxTrigger>)

    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveTextContent('Select publication')
    expect(trigger).toHaveClass(
      'bg-control-raised',
      'border-strong',
      'cursor-pointer',
      'focus-ring',
      'text-left'
    )
    expect(trigger).not.toHaveClass('bg-field')
  })
})
