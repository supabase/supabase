import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Toggle } from './toggle'

describe('Toggle', () => {
  it('aligns its compact sizes with form controls', () => {
    const { rerender } = render(<Toggle size="tiny">Tiny</Toggle>)

    expect(screen.getByRole('button', { name: 'Tiny' })).toHaveClass('h-[26px]')

    rerender(<Toggle size="sm">Small</Toggle>)

    expect(screen.getByRole('button', { name: 'Small' })).toHaveClass('h-[34px]')
  })
})
