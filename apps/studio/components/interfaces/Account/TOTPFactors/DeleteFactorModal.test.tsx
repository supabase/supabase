import { AuthApiError } from '@supabase/supabase-js'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { DeleteFactorModal } from './DeleteFactorModal'
import { auth } from '@/lib/gotrue'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => vi.fn() }))

beforeEach(() => vi.restoreAllMocks())

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
    await screen.findByText('Remove authenticator')
    expect(screen.queryByText('Multi-factor authentication will be disabled')).toBeNull()
    expect(screen.queryByText('Your recovery codes will be removed too')).toBeNull()
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }))
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
    await screen.findByText('Remove authenticator')
    await screen.findByText('Multi-factor authentication will be disabled')
    expect(screen.queryByText('Your recovery codes will be removed too')).toBeNull()
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }))
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
    await screen.findByText('Remove authenticator')
    await screen.findByText('Multi-factor authentication will be disabled')
    await screen.findByText('Your recovery codes will be removed too')
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }))
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
    await screen.findByText('Remove authenticator')
    expect(screen.queryByText('Your recovery codes will be removed too')).toBeNull()
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(unenroll).not.toHaveBeenCalled()
    expect(unenrollRecoveryCodes).not.toHaveBeenCalled()
  })
})

describe('authenticator removal failures', () => {
  test('keeps the dialog open if recovery code removal fails', async () => {
    const unenroll = vi.spyOn(auth.mfa, 'unenroll')
    vi.spyOn(auth.mfa.recoveryCodes, 'unenroll').mockResolvedValue({
      data: null,
      error: new AuthApiError('Codes could not be removed', 500, 'unexpected_failure'),
    })
    const onClose = vi.fn()
    customRender(
      <DeleteFactorModal
        visible
        factorId="factor-a"
        lastFactorToBeDeleted
        hasRecoveryCodes
        onClose={onClose}
      />
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }))
    expect(await screen.findByText(/Codes could not be removed/)).toBeInTheDocument()
    expect(unenroll).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  test('retries factor removal without removing recovery codes a second time', async () => {
    const unenroll = vi
      .spyOn(auth.mfa, 'unenroll')
      .mockResolvedValueOnce({
        data: null,
        error: new AuthApiError('Authenticator could not be removed', 500, 'unexpected_failure'),
      })
      .mockResolvedValueOnce({ data: { id: 'factor-a' }, error: null })
    const unenrollCodes = vi
      .spyOn(auth.mfa.recoveryCodes, 'unenroll')
      .mockResolvedValue({ data: { id: 'codes-a' }, error: null })
    const onClose = vi.fn()
    customRender(
      <DeleteFactorModal
        visible
        factorId="factor-a"
        lastFactorToBeDeleted
        hasRecoveryCodes
        onClose={onClose}
      />
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }))
    expect(await screen.findByText(/Authenticator could not be removed/)).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }))
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
    expect(unenrollCodes).toHaveBeenCalledOnce()
    expect(unenroll).toHaveBeenCalledTimes(2)
  })
})
