import { AuthApiError } from '@supabase/auth-js'
import { createMemoryHistory, createRootRoute, createRouter } from '@tanstack/react-router'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { FeatureFlagContext } from 'common'
import { renderToString } from 'react-dom/server'
import { beforeEach, expect, test, vi } from 'vitest'

import { SignInRecoveryCodeForm } from './SignInRecoveryCodeForm'
import { auth } from '@/lib/gotrue'
import { parseSearch, stringifySearch } from '@/lib/router-search-params'
import { customRender, CustomWrapper } from '@/tests/lib/custom-render'

vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => vi.fn() }))

beforeEach(() => {
  vi.restoreAllMocks()
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
  const router = createRouter({
    routeTree: createRootRoute(),
    history: createMemoryHistory({
      initialEntries: [`${window.location.pathname}${window.location.search}`],
    }),
    parseSearch,
    stringifySearch,
  })
  const navigateSpy = vi.spyOn(router, 'navigate')
  const rendered = customRender(
    <FeatureFlagContext.Provider
      value={{ configcat: { enableAuthRecoveryCodes: true }, posthog: {}, hasLoaded: true }}
    >
      <SignInRecoveryCodeForm />
    </FeatureFlagContext.Provider>,
    { router }
  )
  return { ...rendered, router, navigateSpy }
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
  const { router } = renderForm()
  fireEvent.change(await screen.findByLabelText('Recovery code'), {
    target: { value: 'sample-code' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Verify' }))
  await waitFor(() =>
    expect(router.state.location.href).toBe('/account/security?removeAuthenticator=factor-a')
  )
  expect(remove).not.toHaveBeenCalled()
})

test('cancelling action verification returns to Security without signing out', async () => {
  const signOut = vi.spyOn(auth, 'signOut')
  const { router, navigateSpy } = renderForm()
  fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
  await waitFor(() => expect(router.state.location.href).toBe('/account/security'))
  expect(navigateSpy).toHaveBeenCalledWith(
    expect.objectContaining({ to: '/account/security', replace: true })
  )
  expect(signOut).not.toHaveBeenCalled()
})

test('password recovery continues to password reset and preserves the original destination', async () => {
  window.history.replaceState(
    {},
    '',
    '/sign-in-recovery-code?context=forgot-password&returnTo=%2Fproject%2Fexample'
  )
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
  const { router } = renderForm()
  fireEvent.change(await screen.findByLabelText('Recovery code'), {
    target: { value: 'sample-code' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Verify' }))
  await waitFor(() =>
    expect(router.state.location.href).toBe('/reset-password?returnTo=%2Fproject%2Fexample')
  )
})

test('an invalid recovery code stays on the form with an inline error', async () => {
  vi.spyOn(auth.mfa.recoveryCodes, 'verify').mockResolvedValue({
    data: null,
    error: new AuthApiError('Invalid recovery code', 422, 'mfa_verification_failed'),
  })
  const { navigateSpy } = renderForm()
  fireEvent.change(await screen.findByLabelText('Recovery code'), { target: { value: 'invalid' } })
  fireEvent.click(screen.getByRole('button', { name: 'Verify' }))
  expect(
    await screen.findByText(
      'This recovery code is invalid or has already been used. Try another code.'
    )
  ).toBeInTheDocument()
  expect(screen.getByLabelText('Recovery code')).toHaveAttribute('aria-invalid', 'true')
  expect(screen.queryByText('Unable to verify recovery code')).not.toBeInTheDocument()
  expect(navigateSpy).not.toHaveBeenCalled()
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
