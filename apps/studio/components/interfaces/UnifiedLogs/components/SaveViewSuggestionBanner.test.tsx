import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { SaveViewSuggestionBanner } from './SaveViewSuggestionBanner'

describe('SaveViewSuggestionBanner', () => {
  it('renders nothing when not visible', () => {
    render(
      <SaveViewSuggestionBanner
        visible={false}
        activeFilterCount={3}
        onSave={vi.fn()}
        onDismiss={vi.fn()}
      />
    )

    expect(screen.queryByText('Would you like to save them as a view?')).not.toBeInTheDocument()
  })

  it('shows the filter count in the title, and the question as a description', () => {
    render(
      <SaveViewSuggestionBanner
        visible
        activeFilterCount={5}
        onSave={vi.fn()}
        onDismiss={vi.fn()}
      />
    )

    expect(screen.getByText("You've configured 5 filters!")).toBeInTheDocument()
    expect(screen.getByText('Would you like to save them as a view?')).toBeInTheDocument()
  })

  it('calls onSave when Save is clicked', () => {
    const onSave = vi.fn()
    render(
      <SaveViewSuggestionBanner visible activeFilterCount={3} onSave={onSave} onDismiss={vi.fn()} />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).toHaveBeenCalledOnce()
  })

  it('calls onDismiss when Dismiss is clicked', () => {
    const onDismiss = vi.fn()
    render(
      <SaveViewSuggestionBanner
        visible
        activeFilterCount={3}
        onSave={vi.fn()}
        onDismiss={onDismiss}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))

    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
