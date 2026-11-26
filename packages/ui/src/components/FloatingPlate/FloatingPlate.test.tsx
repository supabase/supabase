import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FloatingPlate } from './FloatingPlate'

describe('FloatingPlate', () => {
  it('renders children inside an opaque plate', () => {
    render(
      <FloatingPlate>
        <button type="button">Copy</button>
      </FloatingPlate>
    )

    const plate = screen.getByRole('button', { name: 'Copy' }).parentElement
    expect(plate?.className).toContain('inline-flex')
    expect(plate?.className).toContain('bg-popover')
    expect(plate?.className).toContain('rounded-lg')
  })

  it('supports pill radius for rounded-full controls', () => {
    const { container } = render(
      <FloatingPlate rounded="full">
        <button type="button">Clear</button>
      </FloatingPlate>
    )

    expect(container.firstElementChild?.className).toContain('rounded-full')
    expect(container.firstElementChild?.className).not.toContain('rounded-lg')
  })

  it('merges layout and reveal classes from the callsite', () => {
    const { container } = render(
      <FloatingPlate className="absolute right-2 top-2 opacity-0 group-hover:opacity-100">
        <button type="button">Copy</button>
      </FloatingPlate>
    )

    const plate = container.firstElementChild as HTMLElement
    expect(plate.className).toContain('absolute')
    expect(plate.className).toContain('right-2')
    expect(plate.className).toContain('opacity-0')
    expect(plate.className).toContain('group-hover:opacity-100')
  })
})
