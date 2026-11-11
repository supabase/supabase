import { AuthApiError } from '@supabase/auth-js'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { FeatureFlagContext } from 'common'
import { renderToString } from 'react-dom/server'
import { beforeEach, expect, test, vi } from 'vitest'

import { SignInRecoveryCodeForm } from './SignInRecoveryCodeForm'
import { auth } from '@/lib/gotrue'
import { customRender, CustomWrapper } from '@/tests/lib/custom-render'

const { push, replace } = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }))
vi.mock('next/router', () => ({ useRouter: () => ({ push, replace }) }))
vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => vi.fn() }))
vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useParams: () => ({ ref: 'default' }),
  useSession: () => ({ access_token: 'test-token' }),
}))

beforeEach(() => {
  vi.restoreAllMocks()
  push.mockReset()
  replace.mockReset()
  window.history.replaceState(
    {},
    '',
    '/sign-in-recovery-code?returnTo=%2Faccount%2Fsecurity%3FremoveAuthenticator%3Dfactor-a'
  )
  vi.spyOn(auth.mfa.recoveryCodes, 'getStatus').mockResolvedValue({
    data: { id: 'codes-a', type: 'recovery_code', remaining: 3, total: 10 },
    error: null,
  })
})

const renderForm = () => {
  return customRender(
    <FeatureFlagContext.Provider
      value={{ configcat: { enableAuthRecoveryCodes: true }, posthog: {}, hasLoaded: true }}
    >
      <SignInRecoveryCodeForm />
    </FeatureFlagContext.Provider>
  )
}

test('verification returns to the selected authenticator without removing it', async () => {
  vi.spyOn(auth.mfa.recoveryCodes, 'verify').mockResolvedValue({
    data: {
      access_token: 'access',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'refresh',
      user: {
        id: 'user',
        aud: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: '',
      },
    },
    error: null,
  })
  const remove = vi.spyOn(auth.mfa, 'unenroll')
  renderForm()
  fireEvent.change(await screen.findByLabelText('Recovery code'), {
    target: { value: 'sample-code' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Verify' }))
  await waitFor(() =>
    expect(push).toHaveBeenCalledWith('/account/security?removeAuthenticator=factor-a')
  )
  expect(remove).not.toHaveBeenCalled()
})

test('cancelling action verification returns to Security without signing out', async () => {
  const signOut = vi.spyOn(auth, 'signOut')
  renderForm()
  fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
  expect(replace).toHaveBeenCalledWith('/account/security')
  expect(signOut).not.toHaveBeenCalled()
})

test('an invalid recovery code stays on the form with an inline error', async () => {
  vi.spyOn(auth.mfa.recoveryCodes, 'verify').mockResolvedValue({
    data: null,
    error: new AuthApiError('Invalid recovery code', 422, 'mfa_verification_failed'),
  })
  renderForm()
  fireEvent.change(await screen.findByLabelText('Recovery code'), { target: { value: 'invalid' } })
  fireEvent.click(screen.getByRole('button', { name: 'Verify' }))
  expect(
    await screen.findByText(
      'This recovery code is invalid or has already been used. Try another code.'
    )
  ).toBeInTheDocument()
  expect(screen.getByLabelText('Recovery code')).toHaveAttribute('aria-invalid', 'true')
  expect(screen.queryByText('Unable to verify recovery code')).not.toBeInTheDocument()
  expect(push).not.toHaveBeenCalled()
})

test('prerenders sign-out navigation without a TanStack router', () => {
  const html = renderToString(
    <CustomWrapper>
      <SignInRecoveryCodeForm />
    </CustomWrapper>
  )
  expect(html).toContain('Sign out and clear cookies')
  expect(html).toContain('href="/logout"')
})

test('service failures remain in an admonition rather than marking the code invalid', async () => {
  vi.spyOn(auth.mfa.recoveryCodes, 'verify').mockResolvedValue({
    data: null,
    error: new AuthApiError('Service unavailable', 503, 'unexpected_failure'),
  })
  renderForm()
  fireEvent.change(await screen.findByLabelText('Recovery code'), {
    target: { value: 'sample-code' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Verify' }))
  expect(await screen.findByText('Unable to verify recovery code')).toBeInTheDocument()
  expect(screen.getByLabelText('Recovery code')).toHaveAttribute('aria-invalid', 'false')
})
