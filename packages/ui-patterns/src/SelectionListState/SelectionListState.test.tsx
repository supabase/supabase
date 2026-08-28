import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SelectionListState } from './SelectionListState'

describe('SelectionListState', () => {
  it('keeps one persistent live region while its state changes', () => {
    const { container, rerender } = render(<SelectionListState loading />)

    const liveRegion = container.querySelector('[aria-live="polite"]')
    expect(liveRegion).not.toBeNull()
    if (!liveRegion) throw new Error('Expected an aria-live status region')
    expect(liveRegion).toHaveAttribute('aria-live', 'polite')
    expect(liveRegion).toHaveClass('sr-only')

    rerender(<SelectionListState empty emptyLabel="No columns found" />)

    expect(screen.getByText('No columns found')).toBe(liveRegion)
    expect(liveRegion).not.toHaveClass('sr-only')
  })
})
