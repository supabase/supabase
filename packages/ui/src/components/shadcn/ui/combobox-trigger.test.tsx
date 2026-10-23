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
      'control-surface-shadows',
      'raised-control-surface',
      'border-0',
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
      'control-surface-shadows',
      'raised-control-surface',
      'border-0'
    )
  })

  it('shows the invalid border on a raised SelectTrigger', () => {
    render(
      <Select defaultValue="first">
        <SelectTrigger aria-invalid="true">
          <SelectValue />
        </SelectTrigger>
      </Select>
    )

    expect(screen.getByRole('combobox')).toHaveClass(
      'border-0',
      'aria-[invalid=true]:border',
      'aria-[invalid=true]:border-destructive-400',
      'aria-[invalid=true]:bg-destructive-200'
    )
  })

  it('matches Button radius at the same size', () => {
    render(
      <>
        <ComboboxTrigger size="small" aria-label="Type">
          Type
        </ComboboxTrigger>
        <Select defaultValue="first">
          <SelectTrigger size="small" aria-label="Default value">
            <SelectValue />
          </SelectTrigger>
        </Select>
      </>
    )

    const radius = 'rounded-[calc(var(--radius-md)*(1+(34/26-1)*0.35))]'
    expect(screen.getByRole('combobox', { name: 'Type' })).toHaveClass(radius)
    expect(screen.getByRole('combobox', { name: 'Default value' })).toHaveClass(radius)
  })
})
