import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TextConfirmModal } from './TextConfirmModal'

describe('TextConfirmModal', () => {
  it('renders preset delete label copy and validates DELETE exactly', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    render(
      <TextConfirmModal
        visible
        loading={false}
        title="Delete organization"
        variant="destructive"
        confirmAction="delete"
        confirmSubject="this organization"
        confirmLabel="Delete organization"
        onConfirm={onConfirm}
        onCancel={() => undefined}
      />
    )

    const label = screen.getByText('Type', { exact: false }).closest('label')
    expect(label).toHaveTextContent('Type DELETE to delete this organization.')

    const submitButton = screen.getByRole('button', { name: 'Delete organization' })
    expect(submitButton).toBeDisabled()

    await user.type(screen.getByRole('textbox'), 'delete')
    expect(submitButton).toBeDisabled()

    await user.clear(screen.getByRole('textbox'))
    await user.type(screen.getByRole('textbox'), 'DELETE')
    expect(submitButton).toBeEnabled()

    await user.click(submitButton)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('preserves custom confirmation string behavior', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    render(
      <TextConfirmModal
        visible
        loading={false}
        title="Request DPA"
        confirmString="user@example.com"
        confirmPlaceholder="Enter your email address"
        confirmLabel="Send request"
        onConfirm={onConfirm}
        onCancel={() => undefined}
      />
    )

    const label = screen.getByText('Type', { exact: false }).closest('label')
    expect(label).toHaveTextContent('Type user@example.com to confirm.')

    const submitButton = screen.getByRole('button', { name: 'Send request' })
    await user.type(screen.getByRole('textbox'), 'user@example.com')
    await user.click(submitButton)

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('validates an action-and-target confirmation exactly', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    render(
      <TextConfirmModal
        visible
        loading={false}
        title="Delete project"
        confirmString="delete nextjs-todo-list"
        confirmPlaceholder="delete nextjs-todo-list"
        confirmLabel="Delete project and all data"
        onConfirm={onConfirm}
        onCancel={() => undefined}
      />
    )

    const submitButton = screen.getByRole('button', { name: 'Delete project and all data' })
    await user.type(screen.getByRole('textbox'), 'DELETE')
    expect(submitButton).toBeDisabled()

    await user.clear(screen.getByRole('textbox'))
    await user.type(screen.getByRole('textbox'), 'delete nextjs-todo-list')
    await user.click(submitButton)

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})
