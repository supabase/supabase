import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

import { DeleteFactorModal } from './DeleteFactorModal'
import { auth } from '@/lib/gotrue'
import { customRender } from '@/tests/lib/custom-render'

describe('DeleteFactorModal', () => {
  test("Requests users confirmation before deleting an MFA when it's not the last", async () => {
    const unenroll = vi.spyOn(auth.mfa, 'unenroll').mockResolvedValue({
      data: {
        id: 'some_id',
      },
      error: null,
    })
    const unenrollRecoveryCodes = vi.spyOn(auth.mfa.recoveryCodes, 'unenroll').mockResolvedValue({
      data: {
        id: 'some_id',
      },
      error: null,
    })
    const onClose = vi.fn()

    customRender(
      <DeleteFactorModal
        visible
        factorId="some_id"
        lastFactorToBeDeleted={false}
        onClose={onClose}
        hasRecoveryCodes
      />
    )
    await screen.findByText('Confirm to delete factor')
    expect(screen.queryByText('Multi-factor authentication will be disabled')).toBeNull()
    expect(screen.queryByText('Your recovery codes will be deleted too')).toBeNull()
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(unenroll).toHaveBeenCalled())
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(unenrollRecoveryCodes).not.toHaveBeenCalled()
  })
  test("Requests users confirmation before deleting an MFA when it's the last one but no recovery codes are available", async () => {
    const unenroll = vi.spyOn(auth.mfa, 'unenroll').mockResolvedValue({
      data: {
        id: 'some_id',
      },
      error: null,
    })
    const unenrollRecoveryCodes = vi.spyOn(auth.mfa.recoveryCodes, 'unenroll').mockResolvedValue({
      data: {
        id: 'some_id',
      },
      error: null,
    })
    const onClose = vi.fn()

    customRender(
      <DeleteFactorModal
        visible
        factorId="some_id"
        lastFactorToBeDeleted
        onClose={onClose}
        hasRecoveryCodes={false}
      />
    )
    await screen.findByText('Confirm to delete factor')
    await screen.findByText('Multi-factor authentication will be disabled')
    expect(screen.queryByText('Your recovery codes will be deleted too')).toBeNull()
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(unenroll).toHaveBeenCalled())
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(unenrollRecoveryCodes).not.toHaveBeenCalled()
  })
  test('Deletes the recovery codes when available and this is the last factor', async () => {
    const unenroll = vi.spyOn(auth.mfa, 'unenroll').mockResolvedValue({
      data: {
        id: 'some_id',
      },
      error: null,
    })
    const unenrollRecoveryCodes = vi.spyOn(auth.mfa.recoveryCodes, 'unenroll').mockResolvedValue({
      data: {
        id: 'some_id',
      },
      error: null,
    })
    const onClose = vi.fn()

    customRender(
      <DeleteFactorModal
        visible
        factorId="some_id"
        lastFactorToBeDeleted
        onClose={onClose}
        hasRecoveryCodes
      />
    )
    await screen.findByText('Confirm to delete factor')
    await screen.findByText('Multi-factor authentication will be disabled')
    await screen.findByText('Your recovery codes will be deleted too')
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(unenrollRecoveryCodes).toHaveBeenCalled())
    await waitFor(() => expect(unenroll).toHaveBeenCalled())
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })
  test('Allows users to cancel the deletion', async () => {
    const unenroll = vi.spyOn(auth.mfa, 'unenroll').mockResolvedValue({
      data: {
        id: 'some_id',
      },
      error: null,
    })
    const unenrollRecoveryCodes = vi.spyOn(auth.mfa.recoveryCodes, 'unenroll').mockResolvedValue({
      data: {
        id: 'some_id',
      },
      error: null,
    })
    const onClose = vi.fn()

    customRender(
      <DeleteFactorModal
        visible
        factorId="some_id"
        lastFactorToBeDeleted={false}
        onClose={onClose}
        hasRecoveryCodes
      />
    )
    await screen.findByText('Confirm to delete factor')
    expect(screen.queryByText('Your recovery codes will be deleted too')).toBeNull()
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(unenroll).not.toHaveBeenCalled()
    expect(unenrollRecoveryCodes).not.toHaveBeenCalled()
  })
})
