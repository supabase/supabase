import type { AuthMFARecoveryCodesStatusResponse, Factor } from '@supabase/supabase-js'
import { QueryClient } from '@tanstack/react-query'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { FeatureFlagContext } from 'common'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { TOTPFactors } from './index'
import { recoveryCodeKeys } from '@/data/recovery-codes/keys'
import { auth } from '@/lib/gotrue'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

mockAnimationsApi()

const factor: Factor<'totp', 'verified'> = {
  id: 'authenticator-a',
  friendly_name: 'Phone',
  factor_type: 'totp',
  status: 'verified',
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
}
const availableCodes: AuthMFARecoveryCodesStatusResponse = {
  data: { id: 'codes-a', type: 'recovery_code', remaining: 10, total: 10 },
  error: null,
}

const renderFactors = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  customRender(
    <FeatureFlagContext.Provider
      value={{
        configcat: { enableAuthRecoveryCodes: true, textConfirmationModalClickToCopy: false },
        posthog: {},
        hasLoaded: true,
      }}
    >
      <TOTPFactors />
    </FeatureFlagContext.Provider>,
    { queryClient }
  )
  return queryClient
}

describe('authenticator removal recovery-status guard', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(auth.mfa, 'getAuthenticatorAssuranceLevel').mockResolvedValue({
      data: { currentLevel: 'aal2', nextLevel: 'aal2', currentAuthenticationMethods: [] },
      error: null,
    })
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'No selected project' }, { status: 404 }),
    })
    vi.spyOn(auth.mfa, 'listFactors').mockResolvedValue({
      data: { all: [factor], totp: [factor], phone: [], webauthn: [], recovery_code: [] },
      error: null,
    })
  })

  test('keeps removal unavailable after a failed status read and enables it after Retry succeeds', async () => {
    const getStatus = vi
      .spyOn(auth.mfa.recoveryCodes, 'getStatus')
      .mockRejectedValue(new Error('Status unavailable'))
    renderFactors()

    expect(await screen.findByText('Failed to load recovery codes')).toBeInTheDocument()
    const remove = screen.getByRole('button', { name: 'Delete' })
    expect(remove).toBeAriaDisabled()
    fireEvent.click(remove)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    getStatus.mockResolvedValue(availableCodes)
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(remove).not.toBeAriaDisabled())
    expect(screen.queryByText('Failed to load recovery codes')).not.toBeInTheDocument()
    fireEvent.click(remove)
    expect(await screen.findByRole('dialog', { name: 'Remove MFA method' })).toBeInTheDocument()
  })

  test('keeps removal unavailable while recovery-code status is loading', async () => {
    vi.spyOn(auth.mfa.recoveryCodes, 'getStatus').mockImplementation(
      () => new Promise<Awaited<ReturnType<typeof auth.mfa.recoveryCodes.getStatus>>>(() => {})
    )
    renderFactors()

    expect(await screen.findByText('Checking recovery codes')).toBeInTheDocument()
    const remove = await screen.findByRole('button', { name: 'Delete' })
    expect(remove).toBeAriaDisabled()
    fireEvent.click(remove)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('disables an open confirmation during a background status refresh and after failure', async () => {
    const getStatus = vi
      .spyOn(auth.mfa.recoveryCodes, 'getStatus')
      .mockResolvedValue(availableCodes)
    vi.spyOn(auth.mfa, 'listFactors').mockResolvedValue({
      data: {
        all: [factor, { ...factor, id: 'pending-factor', status: 'unverified' }],
        totp: [factor],
        phone: [],
        webauthn: [],
        recovery_code: [],
      },
      error: null,
    })
    const unenroll = vi.spyOn(auth.mfa, 'unenroll')
    const queryClient = renderFactors()
    const remove = await screen.findByRole('button', { name: 'Delete' })
    await waitFor(() => expect(remove).not.toBeAriaDisabled())
    fireEvent.click(remove)
    const dialog = await screen.findByRole('dialog', { name: 'Remove MFA method' })
    expect(
      within(dialog).getByText('Multi-factor authentication will be disabled')
    ).toBeInTheDocument()
    const confirm = within(dialog).getByRole('button', { name: 'Remove' })
    expect(confirm).not.toBeDisabled()

    let rejectRefresh: (error: Error) => void = () => {}
    getStatus.mockImplementation(
      () =>
        new Promise((_, reject) => {
          rejectRefresh = reject
        })
    )
    let refresh = Promise.resolve()
    await act(async () => {
      refresh = queryClient.invalidateQueries({ queryKey: recoveryCodeKeys.status() })
    })
    await waitFor(() => expect(confirm).toBeDisabled())
    fireEvent.click(confirm)
    expect(unenroll).not.toHaveBeenCalled()
    await act(async () => {
      rejectRefresh(new Error('Status unavailable'))
      await refresh
    })
    await waitFor(() => expect(confirm).toBeDisabled())
    expect(await within(dialog).findByText(/Status unavailable/)).toBeInTheDocument()
    fireEvent.click(confirm)
    expect(unenroll).not.toHaveBeenCalled()

    getStatus.mockResolvedValue(availableCodes)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(confirm).not.toBeDisabled())
    expect(within(dialog).queryByText(/Status unavailable/)).not.toBeInTheDocument()
    expect(dialog).toBeInTheDocument()
    expect(unenroll).not.toHaveBeenCalled()
  })
})
