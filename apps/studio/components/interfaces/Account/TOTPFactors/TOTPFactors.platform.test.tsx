import type {
  AuthMFARecoveryCodesStatusResponseData,
  Factor,
  Session,
  User,
} from '@supabase/supabase-js'
import { QueryClient } from '@tanstack/react-query'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthContext, FeatureFlagContext } from 'common'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TOTPFactors } from './index'
import { recoveryCodeKeys } from '@/data/recovery-codes/keys'
import { useAccountRecovery } from '@/hooks/misc/useAccountRecovery'
import { auth } from '@/lib/gotrue'
import { customRender } from '@/tests/lib/custom-render'
import { mswServer, type APIErrorBody } from '@/tests/lib/msw'

mockAnimationsApi()

vi.hoisted(() => {
  vi.stubEnv('NEXT_PUBLIC_GOTRUE_URL', 'http://localhost:8000/auth/v1')
})
type AuthUserResponse = Omit<User, 'factors'> & {
  factors: (Omit<Factor, 'status'> & { status: 'verified' | 'unverified' })[]
}

const factor: Factor = {
  id: 'factor-a',
  friendly_name: 'Phone',
  factor_type: 'totp',
  status: 'verified',
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
}
const user: User = {
  id: 'user-a',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  created_at: '2026-10-01T00:00:00Z',
}
const session: Session = {
  access_token: 'test-access',
  refresh_token: 'test-refresh',
  expires_in: 3600,
  token_type: 'bearer',
  user,
}

const SecurityFactors = () => {
  const { findings } = useAccountRecovery()
  return <TOTPFactors findings={findings} primaryAction={undefined} />
}

const renderSection = (searchParams = '', queryClient?: QueryClient) =>
  customRender(
    <AuthContext.Provider
      value={{ session, error: null, isLoading: false, refreshSession: async () => session }}
    >
      <FeatureFlagContext.Provider
        value={{
          configcat: {
            enableAuthRecoveryCodes: true,
            enableAccountPassword: false,
            textConfirmationModalClickToCopy: false,
          },
          posthog: {},
          hasLoaded: true,
        }}
      >
        <SecurityFactors />
      </FeatureFlagContext.Provider>
    </AuthContext.Provider>,
    { nuqs: { searchParams }, queryClient }
  )

describe('account security MFA and recovery sections', () => {
  const mockUser = (factors: AuthUserResponse['factors'] = [factor]) => {
    mswServer.use(
      http.get('*/auth/v1/user', () =>
        HttpResponse.json<AuthUserResponse>({
          id: 'user-a',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'test@example.com',
          app_metadata: {},
          user_metadata: {},
          created_at: '2026-10-01T00:00:00Z',
          factors,
        })
      )
    )
  }

  beforeEach(async () => {
    mockUser()
    mswServer.use(
      http.get('*/platform/projects/default', () =>
        HttpResponse.json<APIErrorBody>({ message: 'Project not found' }, { status: 404 })
      ),
      http.get('*/api/enabled-features-overrides', () =>
        HttpResponse.json({ disabled_features: [] })
      ),
      http.get('*/auth/v1/factors/recovery-codes', () =>
        HttpResponse.json<AuthMFARecoveryCodesStatusResponseData>({
          id: 'codes-a',
          type: 'recovery_code',
          remaining: 10,
          total: 10,
        })
      )
    )
    const expiresAt = Math.floor(Date.now() / 1000) + 3600
    const token = [
      btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })),
      btoa(JSON.stringify({ sub: 'user-a', exp: expiresAt, aal: 'aal2' })).replace(/=+$/, ''),
      'test-signature',
    ].join('.')
    const { error } = await auth.setSession({ access_token: token, refresh_token: 'test-refresh' })
    expect(error).toBeNull()
  })

  afterAll(() => vi.unstubAllEnvs())

  afterEach(async () => {
    await auth.stopAutoRefresh()
    window.localStorage.clear()
  })

  it('shows MFA off when only unverified authenticators exist', async () => {
    mockUser([{ ...factor, status: 'unverified' }])
    renderSection()
    expect(await screen.findByText('Set up multi-factor authentication')).toBeInTheDocument()
    expect(screen.queryByText('Recovery codes')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Set up MFA' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /authenticator.*name/i })).toBeInTheDocument()
  })

  it('shows missing codes with a generation action rather than backup-authenticator advice', async () => {
    mswServer.use(
      http.get('*/auth/v1/factors/recovery-codes', () =>
        HttpResponse.json(
          { code: 'mfa_factor_not_found', msg: 'Recovery codes have not been generated' },
          { status: 404, headers: { 'X-Supabase-Api-Version': '2024-01-01' } }
        )
      )
    )
    renderSection()
    expect(await screen.findByText('No recovery codes')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Generate recovery codes' })).toHaveLength(1)
    expect(screen.queryByText('Add a backup MFA method')).not.toBeInTheDocument()
  })

  it('keeps generated recovery codes visible until they are saved, even after status refreshes', async () => {
    let hasGenerated = false
    mswServer.use(
      http.get('*/auth/v1/factors/recovery-codes', () =>
        hasGenerated
          ? HttpResponse.json({ id: 'codes-a', type: 'recovery_code', total: 1, remaining: 1 })
          : HttpResponse.json(
              { code: 'mfa_factor_not_found', msg: 'Missing' },
              { status: 404, headers: { 'X-Supabase-Api-Version': '2024-01-01' } }
            )
      ),
      http.post('*/auth/v1/factors/recovery-codes', () => {
        hasGenerated = true
        return HttpResponse.json({
          id: 'codes-a',
          type: 'recovery_code',
          total: 1,
          codes: ['abcdefghijklmnop'],
        })
      })
    )
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    renderSection('', queryClient)
    await userEvent.click(await screen.findByRole('button', { name: 'Generate recovery codes' }))
    const savedCheckbox = await screen.findByRole('checkbox', {
      name: 'I have saved my recovery codes somewhere safe',
    })

    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: recoveryCodeKeys.status() })
    })
    await screen.findByText('1 of 1 recovery codes available')
    expect(savedCheckbox).toBeInTheDocument()

    await userEvent.click(savedCheckbox)
    await userEvent.click(screen.getByRole('button', { name: 'Done' }))
    await waitFor(() => expect(savedCheckbox).not.toBeInTheDocument())
    expect(await screen.findByRole('button', { name: 'Regenerate' })).toBeInTheDocument()
  })

  it.each([1, 3])('shows a low code count of %s with a regeneration action', async (remaining) => {
    mswServer.use(
      http.get('*/auth/v1/factors/recovery-codes', () =>
        HttpResponse.json<AuthMFARecoveryCodesStatusResponseData>({
          id: 'codes-a',
          type: 'recovery_code',
          remaining,
          total: 10,
        })
      )
    )
    renderSection()
    expect(
      await screen.findByText(`${remaining} of 10 recovery codes available`)
    ).toBeInTheDocument()
    expect(
      screen.getByText(remaining === 1 ? '1 recovery code remaining' : '3 recovery codes remaining')
    ).toBeInTheDocument()
    expect(
      await screen.findByText('Generate a new set before you need them to recover your account.')
    ).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Regenerate' })).toHaveLength(1)
    expect(
      screen.getByText('Each code can only be used once. Keep them somewhere safe.')
    ).toBeInTheDocument()
  })

  it('shows exhausted codes with regeneration and no standalone removal', async () => {
    mswServer.use(
      http.get('*/auth/v1/factors/recovery-codes', () =>
        HttpResponse.json<AuthMFARecoveryCodesStatusResponseData>({
          id: 'codes-a',
          type: 'recovery_code',
          remaining: 0,
          total: 10,
        })
      )
    )
    renderSection()
    expect(await screen.findByText('Recovery codes used up')).toBeInTheDocument()
    expect(screen.getByText('0 of 10 recovery codes available')).toBeInTheDocument()
    expect(
      screen.getByText('Generate a new set so you have a backup way to sign in.')
    ).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Regenerate' })).toHaveLength(1)
    expect(screen.queryByRole('button', { name: /remove codes/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Recovery code options' })).not.toBeInTheDocument()
    expect(screen.queryByText('Remove codes')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Regenerate' }))
    expect(await screen.findByText('Regenerate my recovery codes')).toBeInTheDocument()
  })

  it('shows healthy recovery codes without backup advice when two authenticators are verified', async () => {
    mockUser([factor, { ...factor, id: 'backup-a', friendly_name: 'Tablet' }])
    renderSection()
    expect(await screen.findByText('10 of 10 recovery codes available')).toBeInTheDocument()
    expect(screen.getByText('Phone')).toBeInTheDocument()
    expect(screen.queryByText('Add a backup MFA method')).not.toBeInTheDocument()
  })

  it('shows a backup warning with one authenticator action', async () => {
    renderSection()
    expect(await screen.findByText('Add a backup MFA method')).toBeInTheDocument()
    expect(await screen.findAllByRole('button', { name: 'Add MFA method' })).toHaveLength(1)
    expect(
      await screen.findByRole('button', { name: 'Remove MFA method: Phone' })
    ).toBeInTheDocument()
  })

  it('keeps recovery codes available when a verified phone factor is the only MFA method', async () => {
    mockUser([{ ...factor, factor_type: 'phone', friendly_name: 'Backup phone' }])
    renderSection()
    expect(await screen.findByText('10 of 10 recovery codes available')).toBeInTheDocument()
    expect(screen.queryByText('Set up multi-factor authentication')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add MFA method' })).toBeInTheDocument()
  })

  it('does not treat an authenticator as the last MFA method when a verified phone factor remains', async () => {
    mockUser([
      factor,
      { ...factor, id: 'phone-a', factor_type: 'phone', friendly_name: 'Backup phone' },
      { ...factor, id: 'unfinished-a', status: 'unverified' },
    ])
    renderSection()
    await userEvent.click(await screen.findByRole('button', { name: 'Remove MFA method: Phone' }))
    expect(await screen.findByText('This action cannot be undone')).toBeInTheDocument()
    expect(
      screen.queryByText('Multi-factor authentication will be disabled')
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Your recovery codes will be deleted too')).not.toBeInTheDocument()
  })

  it('disables removal while cached recovery-code status is being refreshed', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    renderSection('', queryClient)
    await screen.findByText('10 of 10 recovery codes available')
    const removeButton = screen.getByRole('button', { name: 'Remove MFA method: Phone' })
    expect(removeButton).not.toHaveAttribute('aria-disabled', 'true')

    let finishStatus = () => {}
    const statusReady = new Promise<void>((resolve) => {
      finishStatus = resolve
    })
    mswServer.use(
      http.get('*/auth/v1/factors/recovery-codes', async () => {
        await statusReady
        return HttpResponse.json<AuthMFARecoveryCodesStatusResponseData>({
          id: 'codes-a',
          type: 'recovery_code',
          remaining: 1,
          total: 10,
        })
      })
    )
    let refetch = Promise.resolve()
    act(() => {
      refetch = queryClient.invalidateQueries({ queryKey: recoveryCodeKeys.status() })
    })
    await waitFor(() => expect(removeButton).toHaveAttribute('aria-disabled', 'true'))
    await userEvent.click(removeButton)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await act(async () => {
      finishStatus()
      await refetch
    })
    await waitFor(() => expect(removeButton).not.toHaveAttribute('aria-disabled', 'true'))
    expect(await screen.findByText('1 of 10 recovery codes available')).toBeInTheDocument()
  })

  it('does not infer missing codes or allow removal when the status check fails', async () => {
    mswServer.use(
      http.get('*/auth/v1/factors/recovery-codes', () =>
        HttpResponse.json(
          { code: 'unexpected_failure', msg: 'Status unavailable' },
          { status: 500 }
        )
      )
    )
    renderSection()
    expect(await screen.findByText('Failed to load recovery codes')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Generate recovery codes' })
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove MFA method: Phone' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
  })

  it('hides recovery-code settings when MFA methods fail to load', async () => {
    mswServer.use(
      http.get('*/auth/v1/user', () =>
        HttpResponse.json(
          { code: 'unexpected_failure', msg: 'Methods unavailable' },
          { status: 500 }
        )
      )
    )
    renderSection()
    expect(
      await screen.findByText('Failed to retrieve account security information')
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Recovery codes' })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Generate recovery codes' })
    ).not.toBeInTheDocument()
  })
})
