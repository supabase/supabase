import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  type AnyRouter,
} from '@tanstack/react-router'
import { waitFor } from '@testing-library/react'
import { gotrueClient, type AuthContext } from 'common'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { withAuth } from '../withAuth'
import { auth } from '@/lib/gotrue'
import { parseSearch, stringifySearch } from '@/lib/router-search-params'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

function createBasepathRouter(initialEntry: string): AnyRouter {
  const rootRoute = createRootRoute()
  const routes = ['/project/$ref/editor', '/sign-in', '/sign-in-mfa'].map((path) =>
    createRoute({ getParentRoute: () => rootRoute, path })
  )

  return createRouter({
    routeTree: rootRoute.addChildren(routes),
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
    basepath: '/dashboard',
    parseSearch,
    stringifySearch,
  })
}

const ProtectedPage = withAuth(() => <div>Protected content</div>)

describe('withAuth', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('redirects to /sign-in with a basepath-stripped returnTo and preserved search params', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/profile/permissions',
      response: [],
    })
    vi.spyOn(auth.mfa, 'getAuthenticatorAssuranceLevel').mockResolvedValue({
      data: { currentLevel: null, nextLevel: null, currentAuthenticationMethods: [] },
      error: null,
    })
    vi.spyOn(gotrueClient, 'getSession').mockResolvedValue({
      data: { session: null },
      error: null,
    })
    vi.spyOn(gotrueClient, 'signOut').mockResolvedValue({ error: null })

    const router = createBasepathRouter('/dashboard/project/abc/editor?foo=1&bar=2')
    await router.load()

    customRender(<ProtectedPage />, {
      router,
      authContext: {
        isLoading: false,
        session: null,
        error: null,
        refreshSession: vi.fn(),
      } as AuthContext,
    })

    await waitFor(() => expect(router.state.location.pathname).toBe('/sign-in'))
    expect(router.state.location.search).toEqual({
      foo: '1',
      bar: '2',
      returnTo: '/project/abc/editor',
    })
  })

  it('redirects AAL1 sessions needing MFA elevation to /sign-in-mfa with returnTo', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/profile/permissions',
      response: [],
    })
    vi.spyOn(auth.mfa, 'getAuthenticatorAssuranceLevel').mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal2', currentAuthenticationMethods: [] },
      error: null,
    })

    const router = createBasepathRouter('/dashboard/project/abc/editor?tab=columns')
    await router.load()

    customRender(<ProtectedPage />, {
      router,
      authContext: {
        isLoading: false,
        session: { user: { id: 'user-1' } } as AuthContext['session'],
        error: null,
        refreshSession: vi.fn(),
      } as AuthContext,
    })

    await waitFor(() => expect(router.state.location.pathname).toBe('/sign-in-mfa'))
    expect(router.state.location.search).toEqual({
      tab: 'columns',
      returnTo: '/project/abc/editor',
    })
  })

  it('does not redirect when already on /sign-in', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/profile/permissions',
      response: [],
    })
    vi.spyOn(auth.mfa, 'getAuthenticatorAssuranceLevel').mockResolvedValue({
      data: { currentLevel: null, nextLevel: null, currentAuthenticationMethods: [] },
      error: null,
    })
    const signOutSpy = vi.spyOn(gotrueClient, 'signOut').mockResolvedValue({ error: null })

    const router = createBasepathRouter('/dashboard/sign-in?returnTo=%2Fprojects')
    await router.load()

    customRender(<ProtectedPage />, {
      router,
      authContext: {
        isLoading: false,
        session: null,
        error: null,
        refreshSession: vi.fn(),
      } as AuthContext,
    })

    await waitFor(() => expect(auth.mfa.getAuthenticatorAssuranceLevel).toHaveBeenCalled())
    expect(signOutSpy).not.toHaveBeenCalled()
    expect(router.state.location.pathname).toBe('/sign-in')
    expect(router.state.location.search).toEqual({ returnTo: '/projects' })
  })
})
