import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import TextConfirmModal from './TextConfirmModal'

describe('TextConfirmModal', () => {
  it('requires users to enter the confirmation text', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(
      <TextConfirmModal
        visible
        loading={false}
        title="Confirm do stuff"
        confirmPlaceholder="CONFIRM"
        confirmString="CONFIRM"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Submit' }))
    await screen.findByText('Value entered does not match')
    expect(onConfirm).not.toHaveBeenCalled()
  })
  it('calls the confirm callback when users submit the form successfully', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(
      <TextConfirmModal
        visible
        loading={false}
        title="Confirm do stuff"
        confirmPlaceholder="CONFIRM"
        confirmString="CONFIRM"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    await userEvent.type(await screen.findByRole('textbox'), 'CONFIRM')
    fireEvent.click(await screen.findByRole('button', { name: 'Submit' }))
    await waitFor(() => expect(onConfirm).toHaveBeenCalled())
  })
  it('calls the confirm callback when users cancel', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(
      <TextConfirmModal
        visible
        loading={false}
        title="Confirm do stuff"
        confirmPlaceholder="CONFIRM"
        confirmString="CONFIRM"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Close' }))
    await waitFor(() => expect(onCancel).toHaveBeenCalled())
  })
  it('resets its state when closed', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    const { rerender } = render(
      <TextConfirmModal
        visible
        loading={false}
        title="Confirm do stuff"
        confirmPlaceholder="CONFIRM"
        confirmString="CONFIRM"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    await userEvent.type(await screen.findByRole('textbox'), 'CONFIRM')

    // Close the dialog
    rerender(
      <TextConfirmModal
        visible={false}
        loading={false}
        title="Confirm do stuff"
        confirmPlaceholder="CONFIRM"
        confirmString="CONFIRM"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    // Reopen the dialog
    rerender(
      <TextConfirmModal
        visible
        loading={false}
        title="Confirm do stuff"
        confirmPlaceholder="CONFIRM"
        confirmString="CONFIRM"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )
    expect(await screen.findByRole('textbox')).toHaveValue('')
  })
})
