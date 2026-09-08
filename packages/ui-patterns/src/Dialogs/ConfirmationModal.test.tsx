import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ConfirmationModal } from './ConfirmationModal'

describe('ConfirmationModal', () => {
  it('keeps an additional footer action separate from dismissal', async () => {
    const onCancel = vi.fn()
    const onAdditionalAction = vi.fn()

    render(
      <ConfirmationModal
        visible
        title="Assistant changes detected"
        additionalActionLabel="Discard changes"
        onCancel={onCancel}
        onAdditionalAction={onAdditionalAction}
        onConfirm={vi.fn()}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Discard changes' }))

    expect(onAdditionalAction).toHaveBeenCalledOnce()
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('does not dismiss while loading', async () => {
    const onCancel = vi.fn()

    render(
      <ConfirmationModal
        visible
        loading
        title="Saving notebook"
        onCancel={onCancel}
        onConfirm={vi.fn()}
      />
    )

    const dialog = screen.getByRole('dialog', { name: 'Saving notebook' })
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    fireEvent.pointerDown(dialog.parentElement!, { button: 0, ctrlKey: false })

    expect(onCancel).not.toHaveBeenCalled()
  })
})
