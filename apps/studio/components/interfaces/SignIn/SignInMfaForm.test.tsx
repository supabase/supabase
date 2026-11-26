import { createMemoryHistory, createRootRoute, createRouter } from '@tanstack/react-router'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { FeatureFlagContext } from 'common'
import { beforeEach, expect, test, vi } from 'vitest'

import { SignInMfaForm } from './SignInMfaForm'
import { auth } from '@/lib/gotrue'
import { parseSearch, stringifySearch } from '@/lib/router-search-params'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => vi.fn() }))

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(auth.mfa, 'listFactors').mockResolvedValue({
    data: {
      all: [],
      totp: [
        {
          id: 'factor-a',
          factor_type: 'totp',
          status: 'verified',
          created_at: '',
          updated_at: '',
        },
      ],
      phone: [],
      webauthn: [],
      recovery_code: [],
    },
    error: null,
  })
  vi.spyOn(auth.mfa.recoveryCodes, 'getStatus').mockResolvedValue({
    data: { id: 'codes-a', type: 'recovery_code', remaining: 3, total: 10 },
    error: null,
  })
})

test.each(['forgot-password', 'sign-in'] as const)(
  '%s preserves the destination when offering recovery codes',
  async (context) => {
    customRender(
      <FeatureFlagContext.Provider
        value={{ configcat: { enableAuthRecoveryCodes: true }, posthog: {}, hasLoaded: true }}
      >
        <SignInMfaForm context={context} />
      </FeatureFlagContext.Provider>,
      { initialUrl: '/sign-in-mfa?returnTo=%2Fproject%2Fexample' }
    )

    const link = await screen.findByRole('link', { name: 'Authenticate using a recovery code' })
    const url = new URL(link.getAttribute('href') ?? '', window.location.origin)
    expect(url.pathname).toBe('/sign-in-recovery-code')
    expect(url.searchParams.get('returnTo')).toBe('/project/example')
    expect(url.searchParams.get('context')).toBe(
      context === 'forgot-password' ? 'forgot-password' : null
    )
  }
)

test('forgot-password verification navigates to reset-password preserving query params', async () => {
  vi.spyOn(auth.mfa, 'challengeAndVerify').mockResolvedValue({
    data: {
      access_token: 'access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'refresh-token',
      user: {
        id: 'user-id',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '',
      },
    },
    error: null,
  })

  const router = createRouter({
    routeTree: createRootRoute(),
    history: createMemoryHistory({
      initialEntries: ['/forgot-password-mfa?returnTo=%2Fproject%2Fexample&type=recovery'],
    }),
    parseSearch,
    stringifySearch,
  })

  customRender(<SignInMfaForm context="forgot-password" />, { router })

  const input = await screen.findByPlaceholderText('XXXXXX')
  fireEvent.change(input, { target: { value: '123456' } })

  await waitFor(() => expect(router.state.location.pathname).toBe('/reset-password'))
  expect(router.state.location.search).toEqual({
    returnTo: '/project/example',
    type: 'recovery',
  })
})

test('cancel signs out and replaces the history entry with /sign-in', async () => {
  vi.spyOn(auth, 'getSession').mockResolvedValue({ data: { session: null }, error: null })
  const signOut = vi.spyOn(auth, 'signOut').mockResolvedValue({ error: null })

  const history = createMemoryHistory({
    initialEntries: ['/previous', '/sign-in-mfa?returnTo=%2Fproject%2Fexample'],
  })
  const router = createRouter({
    routeTree: createRootRoute(),
    history,
    parseSearch,
    stringifySearch,
  })

  customRender(<SignInMfaForm />, { router })

  fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }))

  await waitFor(() => expect(router.state.location.pathname).toBe('/sign-in'))
  expect(signOut).toHaveBeenCalledOnce()
  expect(history.length).toBe(2)
})
