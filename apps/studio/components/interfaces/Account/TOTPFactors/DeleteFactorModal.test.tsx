import { AuthApiError, AuthError } from '@supabase/auth-js'
import type { AuthMFARecoveryCodesStatusResponse, Factor } from '@supabase/supabase-js'
import { QueryClient } from '@tanstack/react-query'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { FeatureFlagContext } from 'common'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { DeleteFactorModal } from './DeleteFactorModal'
import { profileKeys } from '@/data/profile/keys'
import { auth } from '@/lib/gotrue'
import { customRender } from '@/tests/lib/custom-render'

mockAnimationsApi()

vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => vi.fn() }))

const authenticator: Factor<'totp', 'verified'> = {
  id: 'other_id',
  factor_type: 'totp',
  status: 'verified',
  friendly_name: 'Backup device',
  created_at: '',
  updated_at: '',
}
const mainAuthenticator = { ...authenticator, id: 'some_id', friendly_name: 'Main device' }
const factorsData = (totp: Factor<'totp', 'verified'>[]) => ({
  all: totp,
  totp,
  phone: [],
  recovery_code: [],
  webauthn: [],
})
const availableCodes: AuthMFARecoveryCodesStatusResponse = {
  data: { id: 'codes', type: 'recovery_code', remaining: 10, total: 10 },
  error: null,
}
const unenrolledCodes: AuthMFARecoveryCodesStatusResponse = {
  data: null,
  error: new AuthApiError('No recovery codes', 404, 'mfa_factor_not_found'),
}
const verifyResponse = {
  access_token: 'access',
  token_type: 'bearer' as const,
  expires_in: 3600,
  refresh_token: 'refresh',
  user: { id: 'user', aud: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '' },
}

/**
 * The modal reads the factor list and recovery code status from the query cache. Pass
 * `seededFactors` to have the list available up front, as it is on the security page.
 */
function renderDeletion({
  factorId = 'some_id',
  seededFactors,
  onClose = vi.fn(),
}: {
  factorId?: string
  seededFactors?: Factor<'totp', 'verified'>[]
  onClose?: () => void
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  if (seededFactors) {
    queryClient.setQueryData(profileKeys.mfaFactors(), factorsData(seededFactors))
  }
  customRender(
    <FeatureFlagContext.Provider
      value={{ configcat: { enableAuthRecoveryCodes: true }, posthog: {}, hasLoaded: true }}
    >
      <DeleteFactorModal visible factorId={factorId} onClose={onClose} />
    </FeatureFlagContext.Provider>,
    { queryClient }
  )
  return { onClose }
}

// Removal stays disabled until the recovery code status has loaded
async function clickRemove() {
  const button = await screen.findByRole('button', { name: 'Remove' })
  await waitFor(() => expect(button).toBeEnabled())
  fireEvent.click(button)
}

describe('DeleteFactorModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(auth.mfa, 'getAuthenticatorAssuranceLevel').mockResolvedValue({
      data: { currentLevel: 'aal2', nextLevel: 'aal2', currentAuthenticationMethods: [] },
      error: null,
    })
    vi.spyOn(auth.mfa.recoveryCodes, 'getStatus').mockResolvedValue(availableCodes)
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
    const { onClose } = renderDeletion({ seededFactors: [mainAuthenticator, authenticator] })
    await screen.findByText('Remove MFA method')
    expect(screen.queryByText('Multi-factor authentication will be disabled')).toBeNull()
    expect(screen.queryByText('Your recovery codes will be removed too')).toBeNull()
    await clickRemove()
    await waitFor(() => expect(unenroll).toHaveBeenCalled())
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(unenrollRecoveryCodes).not.toHaveBeenCalled()
  })
  test("Requests users confirmation before deleting an MFA when it's the last one but no recovery codes are available", async () => {
    vi.spyOn(auth.mfa.recoveryCodes, 'getStatus').mockResolvedValue(unenrolledCodes)
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
    const { onClose } = renderDeletion({ seededFactors: [mainAuthenticator] })
    await screen.findByText('Remove MFA method')
    await screen.findByText('Multi-factor authentication will be disabled')
    expect(screen.queryByText('Your recovery codes will be removed too')).toBeNull()
    await clickRemove()
    await waitFor(() => expect(unenroll).toHaveBeenCalled())
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(unenrollRecoveryCodes).not.toHaveBeenCalled()
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
    const { onClose } = renderDeletion({ seededFactors: [mainAuthenticator, authenticator] })
    await screen.findByText('Remove MFA method')
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(unenroll).not.toHaveBeenCalled()
    expect(unenrollRecoveryCodes).not.toHaveBeenCalled()
  })
})

describe('DeleteFactorModal identity verification', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(auth.mfa, 'getAuthenticatorAssuranceLevel').mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal2', currentAuthenticationMethods: [] },
      error: null,
    })
    vi.spyOn(auth.mfa, 'listFactors').mockResolvedValue({
      data: factorsData([authenticator]),
      error: null,
    })
    vi.spyOn(auth.mfa.recoveryCodes, 'getStatus').mockResolvedValue(availableCodes)
    vi.spyOn(auth.mfa, 'unenroll').mockResolvedValue({ data: { id: 'some_id' }, error: null })
    vi.spyOn(auth.mfa.recoveryCodes, 'unenroll').mockResolvedValue({
      data: { id: 'codes' },
      error: null,
    })
  })
  test('recovery-code fallback is a usable link without a router provider', async () => {
    renderDeletion()
    expect(await screen.findByRole('link', { name: 'Use recovery code instead' })).toHaveAttribute(
      'href',
      '/sign-in-recovery-code?returnTo=%2Faccount%2Fsecurity%3FremoveAuthenticator%3Dsome_id'
    )
  })

  test('AAL1 prompts for a code from the single authenticator before removal', async () => {
    renderDeletion()
    await screen.findByText('Verify your identity')
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument()
    const input = await screen.findByRole('textbox', { name: 'Authentication code' })
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(input).toHaveAccessibleDescription('From your authenticator app “Backup device”.')
  })
  test('two authenticators use a dropdown without repeating the app in the code description', async () => {
    vi.spyOn(auth.mfa, 'listFactors').mockResolvedValue({
      data: factorsData([mainAuthenticator, authenticator]),
      error: null,
    })
    renderDeletion()
    expect(await screen.findByRole('combobox', { name: 'Authenticator app' })).toHaveTextContent(
      'Backup device'
    )
    expect(
      screen.getByRole('textbox', { name: 'Authentication code' })
    ).not.toHaveAccessibleDescription(/From your authenticator app/)
  })
  test('verification comes before explicit confirmation and removal deletes codes first', async () => {
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
    fireEvent.change(await screen.findByRole('textbox', { name: 'Authentication code' }), {
      target: { value: '123456' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Verify' }))
    await screen.findByText('Remove MFA method')
    expect(screen.getByText('Your recovery codes will be removed too')).toBeInTheDocument()
    expect(auth.mfa.challengeAndVerify).toHaveBeenCalledWith({
      factorId: 'other_id',
      code: '123456',
    })
    expect(auth.mfa.unenroll).not.toHaveBeenCalled()
    expect(auth.mfa.recoveryCodes.unenroll).not.toHaveBeenCalled()
    await clickRemove()
    await waitFor(() => expect(auth.mfa.unenroll).toHaveBeenCalledOnce())
    expect(vi.mocked(auth.mfa.recoveryCodes.unenroll).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(auth.mfa.unenroll).mock.invocationCallOrder[0]
    )
  })
  test('failed verification shows an error and does not delete anything', async () => {
    vi.spyOn(auth.mfa, 'challengeAndVerify').mockResolvedValue({
      data: null,
      error: new AuthApiError('Invalid verification code', 422, 'mfa_verification_failed'),
    })
    renderDeletion()
    fireEvent.change(await screen.findByRole('textbox', { name: 'Authentication code' }), {
      target: { value: '123456' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Verify' }))
    await screen.findByText('Incorrect code. Enter a new code and try again.')
    const input = screen.getByRole('textbox', { name: 'Authentication code' })
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription(/Incorrect code\./)
    fireEvent.change(input, { target: { value: '654321' } })
    await waitFor(() =>
      expect(
        screen.queryByText('Incorrect code. Enter a new code and try again.')
      ).not.toBeInTheDocument()
    )
    expect(auth.mfa.unenroll).not.toHaveBeenCalled()
    expect(auth.mfa.recoveryCodes.unenroll).not.toHaveBeenCalled()
  })
  test('an assurance lookup failure does not delete anything', async () => {
    vi.spyOn(auth.mfa, 'getAuthenticatorAssuranceLevel').mockResolvedValue({
      data: null,
      error: new AuthError('Session check failed'),
    })
    renderDeletion()
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
    fireEvent.change(await screen.findByRole('textbox', { name: 'Authentication code' }), {
      target: { value: '123456' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Verify' }))
    await screen.findByText(/Verification did not update your session/)
    expect(auth.mfa.unenroll).not.toHaveBeenCalled()
    expect(auth.mfa.recoveryCodes.unenroll).not.toHaveBeenCalled()
  })
  test('cancelling verification never opens removal confirmation or deletes anything', async () => {
    const { onClose } = renderDeletion()
    await screen.findByRole('textbox', { name: 'Authentication code' })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledOnce()
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument()
    expect(auth.mfa.unenroll).not.toHaveBeenCalled()
    expect(auth.mfa.recoveryCodes.unenroll).not.toHaveBeenCalled()
  })
  test('a failed authenticator lookup can be retried before verification', async () => {
    const listFactors = vi.spyOn(auth.mfa, 'listFactors').mockResolvedValueOnce({
      data: null,
      error: new AuthError('Authenticators unavailable'),
    })
    renderDeletion()
    await screen.findByText(/Authenticators unavailable/)
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await screen.findByRole('textbox', { name: 'Authentication code' })
    expect(listFactors).toHaveBeenCalledTimes(2)
    expect(auth.mfa.unenroll).not.toHaveBeenCalled()
  })
})

describe('authenticator removal failures', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(auth.mfa, 'getAuthenticatorAssuranceLevel').mockResolvedValue({
      data: { currentLevel: 'aal2', nextLevel: 'aal2', currentAuthenticationMethods: [] },
      error: null,
    })
  })
  test('keeps the dialog open if recovery code removal fails', async () => {
    vi.spyOn(auth.mfa.recoveryCodes, 'getStatus').mockResolvedValue(availableCodes)
    const unenroll = vi.spyOn(auth.mfa, 'unenroll')
    vi.spyOn(auth.mfa.recoveryCodes, 'unenroll').mockResolvedValue({
      data: null,
      error: new AuthApiError('Codes could not be removed', 500, 'unexpected_failure'),
    })
    const { onClose } = renderDeletion({
      factorId: 'factor-a',
      seededFactors: [{ ...authenticator, id: 'factor-a' }],
    })
    await clickRemove()
    expect(await screen.findByText(/Codes could not be removed/)).toBeInTheDocument()
    expect(unenroll).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  test('retries factor removal without removing recovery codes a second time', async () => {
    // Removing the codes invalidates their status, which then reports them as gone
    vi.spyOn(auth.mfa.recoveryCodes, 'getStatus')
      .mockResolvedValueOnce(availableCodes)
      .mockResolvedValue(unenrolledCodes)
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
    const { onClose } = renderDeletion({
      factorId: 'factor-a',
      seededFactors: [{ ...authenticator, id: 'factor-a' }],
    })
    await clickRemove()
    expect(await screen.findByText(/Authenticator could not be removed/)).toBeInTheDocument()
    expect(
      screen.getByText(/Your recovery codes were removed, but your MFA method is still active/)
    ).toBeInTheDocument()
    expect(screen.getByText('Your recovery codes will be removed too')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'contact support' })).toBeInTheDocument()
    await clickRemove()
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
    expect(unenrollCodes).toHaveBeenCalledOnce()
    expect(unenroll).toHaveBeenCalledTimes(2)
  })
})
