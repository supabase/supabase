import { AuthError } from '@supabase/auth-js'
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { FeatureFlagContext } from 'common'
import { beforeEach, expect, test, vi } from 'vitest'

import { SignInRecoveryCodeForm } from './SignInRecoveryCodeForm'
import { auth } from '@/lib/gotrue'
import { customRender } from '@/tests/lib/custom-render'

const { push, replace } = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }))
vi.mock('next/router', () => ({ useRouter: () => ({ push, replace }) }))
vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => vi.fn() }))

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
  const rootRoute = createRootRoute({ component: SignInRecoveryCodeForm })
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  return customRender(
    <FeatureFlagContext.Provider
      value={{ configcat: { enableAuthRecoveryCodes: true }, posthog: {}, hasLoaded: true }}
    >
      <RouterProvider router={router} />
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
    error: new AuthError('Invalid recovery code'),
  })
  renderForm()
  fireEvent.change(await screen.findByLabelText('Recovery code'), { target: { value: 'invalid' } })
  fireEvent.click(screen.getByRole('button', { name: 'Verify' }))
  expect(await screen.findByText(/Invalid recovery code/)).toBeInTheDocument()
  expect(push).not.toHaveBeenCalled()
})
