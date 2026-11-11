import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ViewSuggestionBanner } from './ViewSuggestionBanner'

const baseProps = {
  visible: true,
  title: "You've configured 5 filters!",
  description: 'Would you like to save them as a view?',
  primaryLabel: 'Save',
  onPrimary: vi.fn(),
  onDismiss: vi.fn(),
}

describe('ViewSuggestionBanner', () => {
  it('renders nothing when not visible', () => {
    render(<ViewSuggestionBanner {...baseProps} visible={false} />)

    expect(screen.queryByText(baseProps.description)).not.toBeInTheDocument()
  })

  it('shows the title and description when visible', () => {
    render(<ViewSuggestionBanner {...baseProps} />)

    expect(screen.getByText(baseProps.title)).toBeInTheDocument()
    expect(screen.getByText(baseProps.description)).toBeInTheDocument()
  })

  it('shows the given primary label and calls onPrimary when clicked', () => {
    const onPrimary = vi.fn()
    render(
      <ViewSuggestionBanner
        {...baseProps}
        primaryLabel="Update"
        title="You have modified your view"
        description="Would you like to update?"
        onPrimary={onPrimary}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Update' }))

    expect(onPrimary).toHaveBeenCalledOnce()
  })

  it('calls onDismiss when the dismiss button is clicked', () => {
    const onDismiss = vi.fn()
    render(<ViewSuggestionBanner {...baseProps} onDismiss={onDismiss} />)

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))

    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
