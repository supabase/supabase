import {
  createRootRoute,
  createRoute,
  RouterContextProvider,
  type AnyRouter,
} from '@tanstack/react-router'
import { act, renderHook, waitFor } from '@testing-library/react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'

import { buildSearchUpdateArgs, NuqsAdapter } from './nuqs-tanstack-adapter'
import { createTestRouter } from '@/tests/lib/custom-render'

describe('buildSearchUpdateArgs (custom nuqs adapter)', () => {
  it('targets the current pathname with the search state as a record', () => {
    // The regression we fixed: the stock tanstack-router adapter navigated to
    // a relative `?provider=...`, which TanStack resolved by appending —
    // landing on `/auth/providers/?provider=...` (trailing slash injected).
    expect(buildSearchUpdateArgs('/auth/providers', new URLSearchParams('provider=apple'))).toEqual(
      { to: '/auth/providers', search: { provider: 'apple' } }
    )
  })

  it('returns an empty search record when every param is cleared', () => {
    // `search: {}` on TanStack navigate clears every param.
    expect(buildSearchUpdateArgs('/auth/providers', new URLSearchParams())).toEqual({
      to: '/auth/providers',
      search: {},
    })
  })

  it('keeps values verbatim, including newlines and other control chars', () => {
    // The second regression we fixed: rendering the query string into the
    // navigate `to` sent it through TanStack's path interpolation, which
    // percent-decodes and strips control characters — Logs Explorer's
    // multi-line SQL in `s` lost every newline (`desc\nlimit 5` became
    // `desclimit 5`). Passing a search *record* keeps values untouched.
    const sql = "select *\nfrom logs\nwhere source = 'edge'\norder by timestamp desc\nlimit 5"
    const params = new URLSearchParams()
    params.set('s', sql)
    expect(buildSearchUpdateArgs('/project/abc/logs/explorer', params).search).toEqual({ s: sql })
  })

  it('preserves repeated keys as arrays', () => {
    expect(
      buildSearchUpdateArgs('/advisors/security', new URLSearchParams('f=a&f=b&page=2')).search
    ).toEqual({ f: ['a', 'b'], page: '2' })
  })

  it('strips a trailing slash from the pathname, but keeps the root "/"', () => {
    const empty = new URLSearchParams()
    expect(buildSearchUpdateArgs('/auth/providers/', empty).to).toBe('/auth/providers')
    expect(buildSearchUpdateArgs('/', empty).to).toBe('/')
    expect(buildSearchUpdateArgs('', empty).to).toBe('/')
  })
})

describe('NuqsAdapter', () => {
  it('writes to the current route when called through a setter from an earlier render', async () => {
    const rootRoute = createRootRoute()
    const routes = ['/project/$ref/settings/general', '/project/$ref/database/settings'].map(
      (path) => createRoute({ getParentRoute: () => rootRoute, path })
    )
    const router: AnyRouter = createTestRouter(
      '/project/abc/settings/general',
      rootRoute.addChildren(routes)
    )
    await router.load()

    const wrapper = ({ children }: { children: ReactNode }) => (
      <RouterContextProvider router={router}>
        <NuqsAdapter>{children}</NuqsAdapter>
      </RouterContextProvider>
    )
    const { result } = renderHook(() => useQueryState('showConnect', parseAsBoolean), { wrapper })
    const [, retainedSetter] = result.current

    await act(() => router.navigate<AnyRouter, string>({ to: '/project/abc/database/settings' }))
    await act(() => retainedSetter(true))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/project/abc/database/settings')
      expect(router.state.location.search).toEqual({ showConnect: 'true' })
    })
  })
})
