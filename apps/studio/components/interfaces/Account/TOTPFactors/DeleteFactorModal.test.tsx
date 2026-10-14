import { AuthError } from '@supabase/auth-js'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { DeleteFactorModal } from './DeleteFactorModal'
import { auth } from '@/lib/gotrue'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => vi.fn() }))

describe('DeleteFactorModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(auth.mfa, 'getAuthenticatorAssuranceLevel').mockResolvedValue({
      data: { currentLevel: 'aal2', nextLevel: 'aal2', currentAuthenticationMethods: [] },
      error: null,
    })
  })
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

const authenticator = {
  id: 'other_id',
  factor_type: 'totp' as const,
  status: 'verified' as const,
  friendly_name: 'Backup device',
  created_at: '',
  updated_at: '',
}
const verifyResponse = {
  access_token: 'access',
  token_type: 'bearer' as const,
  expires_in: 3600,
  refresh_token: 'refresh',
  user: { id: 'user', aud: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '' },
}
function renderDeletion() {
  customRender(
    <DeleteFactorModal
      visible
      factorId="some_id"
      lastFactorToBeDeleted
      hasRecoveryCodes
      onClose={vi.fn()}
    />
  )
}

describe('DeleteFactorModal identity verification', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(auth.mfa, 'getAuthenticatorAssuranceLevel').mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal2', currentAuthenticationMethods: [] },
      error: null,
    })
    vi.spyOn(auth.mfa, 'listFactors').mockResolvedValue({
      data: {
        all: [authenticator],
        totp: [authenticator],
        phone: [],
        recovery_code: [],
        webauthn: [],
      },
      error: null,
    })
    vi.spyOn(auth.mfa, 'unenroll').mockResolvedValue({ data: { id: 'some_id' }, error: null })
    vi.spyOn(auth.mfa.recoveryCodes, 'unenroll').mockResolvedValue({
      data: { id: 'codes' },
      error: null,
    })
  })
  test('AAL1 prompts verification without deleting anything', async () => {
    renderDeletion()
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }))
    await screen.findByText('Verify your identity')
    expect(auth.mfa.unenroll).not.toHaveBeenCalled()
    expect(auth.mfa.recoveryCodes.unenroll).not.toHaveBeenCalled()
    expect(screen.getByRole('combobox', { name: 'Authenticator app' })).toHaveTextContent(
      'Backup device'
    )
  })
  test('step-up using another authenticator requires another explicit confirm and deletes codes first', async () => {
    const assurance = vi.spyOn(auth.mfa, 'getAuthenticatorAssuranceLevel')
    assurance.mockResolvedValueOnce({
      data: { currentLevel: 'aal1', nextLevel: 'aal2', currentAuthenticationMethods: [] },
      error: null,
    })
    assurance.mockResolvedValue({
      data: { currentLevel: 'aal2', nextLevel: 'aal2', currentAuthenticationMethods: [] },
      error: null,
    })
    vi.spyOn(auth.mfa, 'challengeAndVerify').mockResolvedValue({
      data: verifyResponse,
      error: null,
    })
    renderDeletion()
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }))
    fireEvent.change(await screen.findByRole('textbox', { name: 'Authentication code' }), {
      target: { value: '123456' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Verify' }))
    await screen.findByText('Remove authenticator')
    expect(auth.mfa.challengeAndVerify).toHaveBeenCalledWith({
      factorId: 'other_id',
      code: '123456',
    })
    expect(auth.mfa.unenroll).not.toHaveBeenCalled()
    expect(auth.mfa.recoveryCodes.unenroll).not.toHaveBeenCalled()
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }))
    await waitFor(() => expect(auth.mfa.unenroll).toHaveBeenCalledOnce())
    expect(vi.mocked(auth.mfa.recoveryCodes.unenroll).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(auth.mfa.unenroll).mock.invocationCallOrder[0]
    )
  })
  test('failed verification shows an inline error and does not delete anything', async () => {
    vi.spyOn(auth.mfa, 'challengeAndVerify').mockResolvedValue({
      data: null,
      error: new AuthError('Invalid verification code'),
    })
    renderDeletion()
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }))
    fireEvent.change(await screen.findByRole('textbox', { name: 'Authentication code' }), {
      target: { value: '123456' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Verify' }))
    await screen.findByText(/Invalid verification code/)
    expect(auth.mfa.unenroll).not.toHaveBeenCalled()
    expect(auth.mfa.recoveryCodes.unenroll).not.toHaveBeenCalled()
  })
  test('an assurance lookup failure does not delete anything', async () => {
    vi.spyOn(auth.mfa, 'getAuthenticatorAssuranceLevel').mockResolvedValue({
      data: null,
      error: new AuthError('Session check failed'),
    })
    renderDeletion()
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }))
    await screen.findByText(/Session check failed/)
    expect(auth.mfa.unenroll).not.toHaveBeenCalled()
    expect(auth.mfa.recoveryCodes.unenroll).not.toHaveBeenCalled()
  })
  test('a verification response that leaves AAL1 never enables removal', async () => {
    vi.spyOn(auth.mfa, 'challengeAndVerify').mockResolvedValue({
      data: verifyResponse,
      error: null,
    })
    renderDeletion()
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }))
    fireEvent.change(await screen.findByRole('textbox', { name: 'Authentication code' }), {
      target: { value: '123456' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Verify' }))
    await screen.findByText(/Verification did not update your session/)
    expect(auth.mfa.unenroll).not.toHaveBeenCalled()
    expect(auth.mfa.recoveryCodes.unenroll).not.toHaveBeenCalled()
  })
  test('insufficient assurance from the backend returns to verification without raw AAL copy', async () => {
    vi.spyOn(auth.mfa, 'getAuthenticatorAssuranceLevel').mockResolvedValue({
      data: { currentLevel: 'aal2', nextLevel: 'aal2', currentAuthenticationMethods: [] },
      error: null,
    })
    vi.spyOn(auth.mfa.recoveryCodes, 'unenroll').mockResolvedValue({
      data: null,
      error: new AuthError('AAL2 required', 403, 'insufficient_aal'),
    })
    renderDeletion()
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }))
    await screen.findByText('Verify your identity')
    await screen.findByText(/Verify your identity before removing this authenticator/)
    expect(screen.queryByText(/AAL2 required/)).toBeNull()
    expect(auth.mfa.unenroll).not.toHaveBeenCalled()
  })
  test('recovery-code deletion failure prevents factor removal', async () => {
    vi.spyOn(auth.mfa, 'getAuthenticatorAssuranceLevel').mockResolvedValue({
      data: { currentLevel: 'aal2', nextLevel: 'aal2', currentAuthenticationMethods: [] },
      error: null,
    })
    vi.spyOn(auth.mfa.recoveryCodes, 'unenroll').mockResolvedValue({
      data: null,
      error: new AuthError('Codes could not be removed'),
    })
    renderDeletion()
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }))
    await screen.findByText(/Codes could not be removed/)
    expect(auth.mfa.unenroll).not.toHaveBeenCalled()
  })
})
