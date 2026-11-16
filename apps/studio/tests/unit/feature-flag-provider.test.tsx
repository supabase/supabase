import { render, waitFor } from '@testing-library/react'
import {
  AuthContext,
  FeatureFlagProvider,
  useFeatureFlags,
  type FeatureFlagContextType,
} from 'common'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { createMockAuthContext, createMockSession } from '@/tests/lib/auth-helpers'

type AuthContextValue = ComponentProps<typeof AuthContext.Provider>['value']
type ConfigCatFlagsFetcher = NonNullable<
  ComponentProps<typeof FeatureFlagProvider>['getConfigCatFlags']
>

const LOGGED_OUT: AuthContextValue = {
  session: null,
  error: null,
  isLoading: false,
  refreshSession: async () => null,
}

const ANOTHER_USER = createMockAuthContext({
  session: createMockSession({ user: { ...createMockSession().user, id: 'another-user' } }),
})

let flags: FeatureFlagContextType
const FlagsProbe = () => {
  flags = useFeatureFlags()
  return null
}

const renderProvider = (auth: AuthContextValue, getConfigCatFlags: ConfigCatFlagsFetcher) => {
  const tree = (authContext: AuthContextValue) => (
    <AuthContext.Provider value={authContext}>
      <FeatureFlagProvider enabled={{ cc: true, ph: false }} getConfigCatFlags={getConfigCatFlags}>
        <FlagsProbe />
      </FeatureFlagProvider>
    </AuthContext.Provider>
  )
  const { rerender } = render(tree(auth))
  return { changeAuth: (authContext: AuthContextValue) => rerender(tree(authContext)) }
}

const flagsLoaded = () => waitFor(() => expect(flags.hasLoaded).toBe(true))

// The first fetch lands at once, the refetch only when `landRefetch` is called
const createFetcherWithHeldRefetch = () => {
  let landRefetch = () => {}
  const refetch = new Promise<[]>((resolve) => {
    landRefetch = () => resolve([])
  })
  const fetcher = vi.fn<ConfigCatFlagsFetcher>().mockResolvedValueOnce([]).mockReturnValue(refetch)
  return { fetcher, landRefetch: () => landRefetch() }
}

describe('FeatureFlagProvider hasFlagsForSignedInUser', () => {
  it('is true for flags fetched for the signed-in user', async () => {
    renderProvider(createMockAuthContext(), async () => [])
    await flagsLoaded()

    expect(flags.hasFlagsForSignedInUser).toBe(true)
  })

  it('is false for a logged-out visitor', async () => {
    renderProvider(LOGGED_OUT, async () => [])
    await flagsLoaded()

    expect(flags.hasFlagsForSignedInUser).toBe(false)
  })

  it.each<[string, AuthContextValue]>([
    ['flags fetched before sign-in', LOGGED_OUT],
    ['flags fetched for another user', ANOTHER_USER],
  ])('is false for %s until the refetch lands', async (_, authAtFirstFetch) => {
    const { fetcher, landRefetch } = createFetcherWithHeldRefetch()
    const { changeAuth } = renderProvider(authAtFirstFetch, fetcher)
    await flagsLoaded()

    changeAuth(createMockAuthContext())
    expect(flags.hasFlagsForSignedInUser).toBe(false)

    landRefetch()
    await waitFor(() => expect(flags.hasFlagsForSignedInUser).toBe(true))
  })
})
