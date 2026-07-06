import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { renderQueryString } from 'nuqs/adapters/custom'
import { describe, expect, it } from 'vitest'

import { resolveSearchOrHashOnlyTarget } from '../compat/next/router'
import { buildSearchUpdateTarget } from './nuqs-tanstack-adapter'
import { parseSearch, stringifySearch } from './router-search-params'

// Integration guard for the family of URL-shape regressions from the
// TanStack migration: drives a real router (with the app's custom search
// codec) through the navigation shapes the compat shims and the nuqs
// adapter produce, and asserts the built hrefs are Next-shaped — no JSON
// coercion/quoting, no dropped repeated keys, no injected trailing slash,
// no doubled `#`.
describe('URL shape end-to-end against a real router', () => {
  it('produces Next-shaped URLs for every fixed producer', async () => {
    const rootRoute = createRootRoute({})
    const routes = ['/project/$ref/advisors/security', '/project/$ref/auth/providers', '/org'].map(
      (p) => createRoute({ getParentRoute: () => rootRoute, path: p })
    )
    rootRoute.addChildren(routes)
    const router = createRouter({
      routeTree: rootRoute,
      history: createMemoryHistory({
        initialEntries: [
          '/project/abc/advisors/security?preset=security&filter=a:eq:1&filter=b:eq:2',
        ],
      }),
      parseSearch,
      stringifySearch,
    })
    await router.load()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const build = (opts: any) => router.buildLocation(opts).href

    // Custom codec: strings and repeated-key arrays, no JSON coercion.
    expect(router.state.location.search).toEqual({
      preset: 'security',
      filter: ['a:eq:1', 'b:eq:2'],
    })

    // Compat router push({ query }) resolves to a ?-only target; must stay
    // on the exact current pathname (no `/advisors/security/?...`).
    const target = resolveSearchOrHashOnlyTarget('?preset=WARN', router.state.location.pathname)
    expect(build({ to: target })).toBe('/project/abc/advisors/security?preset=WARN')

    // nuqs write over the whole page query — same guarantee.
    const params = new URLSearchParams(router.state.location.searchStr)
    params.set('preset', 'perf')
    expect(
      build({
        to: buildSearchUpdateTarget(router.state.location.pathname, renderQueryString(params)),
        hash: (h: string | undefined) => h ?? '',
      })
    ).toBe('/project/abc/advisors/security?preset=perf&filter=a:eq:1&filter=b:eq:2')

    // nuqs clear-all keeps the exact pathname.
    expect(
      build({
        to: buildSearchUpdateTarget(
          router.state.location.pathname,
          renderQueryString(new URLSearchParams())
        ),
      })
    ).toBe('/project/abc/advisors/security')

    // A bare fragment (the Link shim's hash shape) produces a single '#'.
    expect(build({ to: '/org', hash: 'invoices' })).toBe('/org#invoices')
  })
})
