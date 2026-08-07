import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AlertDescription } from './alert'

describe('AlertDescription', () => {
  it('uses normal text wrapping by default', () => {
    render(<AlertDescription>Alert body copy.</AlertDescription>)

    const description = screen.getByText('Alert body copy.').parentElement

    expect(description).toHaveAttribute('data-slot', 'alert-description')
    expect(description).not.toHaveClass('text-balance', 'md:text-pretty')
  })

  it('allows consumers to opt into balanced wrapping', () => {
    render(<AlertDescription className="text-balance">Balanced alert body copy.</AlertDescription>)

    const description = screen.getByText('Balanced alert body copy.').parentElement

    expect(description).toHaveClass('text-balance')
  })
})
