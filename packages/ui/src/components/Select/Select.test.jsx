import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'

import Select from './Select'

describe('#Select', () => {
  it('should render select correctly', async () => {
    render(
      <Select data-testid="form-select">
        <option>1</option>
        <option>2</option>
      </Select>
    )
    expect(screen.queryByTestId('form-select')).toBeInTheDocument()
  })

  it('should have "form-select--error" class', () => {
    render(
      <Select error data-testid="form-select">
        <option>1</option>
        <option>2</option>
      </Select>
    )
    expect(screen.queryByTestId('form-select')).toHaveClass(
      'block box-border w-full rounded-md shadow-sm transition-all text-foreground border focus-visible:shadow-md outline-none focus:ring-current focus:ring-2 focus-visible:border-foreground-muted focus-visible:ring-background-control placeholder-foreground-muted appearance-none bg-none bg-destructive-200 border border-destructive-500 focus:ring-destructive-400 placeholder:text-destructive-400 text-base md:text-sm px-4 py-2'
    )
  })
})
