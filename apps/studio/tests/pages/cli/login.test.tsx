import { waitFor } from '@testing-library/dom'
import { expect, test, vi } from 'vitest'

import * as cliLogin from '@/data/cli/login'
import { ProfileContextType } from '@/lib/profile'
import { CliLoginScreen } from '@/pages/cli/login'
import { customRender } from '@/tests/lib/custom-render'

const DEFAULT_PROFILE_CONTEXT: ProfileContextType = {
  profile: {
    id: 1,
    auth0_id: 'auth0|test',
    gotrue_id: 'gotrue-test',
    username: 'testuser',
    primary_email: 'test@example.com',
    first_name: null,
    last_name: null,
    mobile: null,
    is_alpha_user: false,
    is_sso_user: false,
    disabled_features: [],
    free_project_limit: null,
  },
  error: null,
  isLoading: false,
  isError: false,
  isSuccess: true,
}

test('still navigates after parent re-renders during an in-flight POST', async () => {
  // Resolve manually so we can inject a re-render while the POST is in flight.
  let resolveSession: (value: { nonce: string }) => void = () => {}
  const createCliLoginSessionMock = vi.spyOn(cliLogin, 'createCliLoginSession').mockImplementation(
    () =>
      new Promise<{ nonce: string }>((resolve) => {
        resolveSession = resolve
      })
  )
  const initialNavigate = vi.fn()
  const { rerender } = customRender(
    <CliLoginScreen
      isLoggedIn
      routerReady
      sessionId="session-test"
      publicKey="public-key-test"
      tokenName="local-dev"
      navigate={initialNavigate}
    />,
    { profileContext: DEFAULT_PROFILE_CONTEXT }
  )

  await waitFor(() => {
    expect(createCliLoginSessionMock).toHaveBeenCalledTimes(1)
  })

  // Parent re-renders mid-POST with a brand-new navigate ref. This was the
  // production hang: the cleanup would invalidate the success handler and
  // the ref guard would skip the retry, leaving the screen on the loader.
  const laterNavigate = vi.fn()
  rerender(
    <CliLoginScreen
      isLoggedIn
      routerReady
      sessionId="session-test"
      publicKey="public-key-test"
      tokenName="local-dev"
      navigate={laterNavigate}
    />
  )

  resolveSession({ nonce: 'ABCDEFGH12345678' })

  await waitFor(() => {
    expect(laterNavigate).toHaveBeenCalledWith('/cli/login?device_code=ABCDEFGH')
  })
  expect(initialNavigate).not.toHaveBeenCalled()
  expect(createCliLoginSessionMock).toHaveBeenCalledTimes(1)
})
