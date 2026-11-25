import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import {
  AuthorizationConfirmDialog,
  AuthorizationConfirmDialogProps,
} from './AuthorizationConfirmDialog'
import { customRender } from '@/tests/lib/custom-render'

const ACKNOWLEDGEMENT = 'I understand this is permanent. I can test it on a duplicate app first'

const renderDialog = (props: Partial<AuthorizationConfirmDialogProps> = {}) => {
  const resolvedProps: AuthorizationConfirmDialogProps = {
    visible: true,
    loading: false,
    changes: { isApproverChanged: true, isProjectReachChanged: false },
    onCancel: vi.fn(),
    onConfirm: vi.fn(),
    ...props,
  }

  customRender(<AuthorizationConfirmDialog {...resolvedProps} />)
  return resolvedProps
}

describe('AuthorizationConfirmDialog', () => {
  test('warns about permanence and lists one bullet per change', async () => {
    renderDialog({ changes: { isApproverChanged: true, isProjectReachChanged: true } })

    expect(await screen.findByText("This can't be undone after you save")).toBeVisible()
    expect(await screen.findByText(/Each member will connect with their own access/)).toBeVisible()
    expect(await screen.findByText(/limit your app to specific projects/)).toBeVisible()
    expect(await screen.findByText(/Existing connections keep working/)).toBeVisible()
  })

  test('only lists the changes that were actually made', async () => {
    renderDialog({ changes: { isApproverChanged: false, isProjectReachChanged: true } })

    expect(await screen.findByText(/limit your app to specific projects/)).toBeVisible()
    expect(screen.queryByText(/Each member will connect with their own access/)).toBeNull()
  })

  test('keeps the confirm action disabled until the change is acknowledged', async () => {
    const { onConfirm } = renderDialog()

    const confirmButton = await screen.findByRole('button', { name: 'Save permanently' })
    expect(confirmButton).toBeDisabled()

    fireEvent.click(await screen.findByLabelText(ACKNOWLEDGEMENT))

    expect(confirmButton).toBeEnabled()
    fireEvent.click(confirmButton)
    expect(onConfirm).toHaveBeenCalled()
  })

  test('going back leaves the changes unsaved', async () => {
    const { onCancel, onConfirm } = renderDialog()

    fireEvent.click(await screen.findByRole('button', { name: 'Go back' }))

    expect(onCancel).toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
