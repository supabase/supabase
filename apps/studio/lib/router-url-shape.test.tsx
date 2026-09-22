import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  type AnyRouter,
} from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'

import {
  resolveSearchOrHashOnlyTarget,
  resolveUrl,
  withDefaultPathname,
} from '../compat/next/router'
import { splitInternalUrl } from './internal-url'
import { buildSearchUpdateArgs } from './nuqs-tanstack-adapter'
import { parseSearch, stringifySearch, type SearchRecord } from './router-search-params'

// The `<AnyRouter, string>` type arguments mirror the compat shims: the
// producers under test emit free-form runtime strings that can't satisfy
// the route-path union at compile time.
interface LooseNavigateArgs {
  to: string
  search?: SearchRecord
  hash?: string | ((prevHash: string | undefined) => string)
  replace?: boolean
}

// Integration guard for the family of URL-shape regressions from the
// TanStack migration: drives a real router (with the app's custom search
// codec) through the navigation shapes the compat shims and the nuqs
// adapter produce, and asserts the built hrefs are Next-shaped — no JSON
// coercion/quoting, no dropped repeated keys, no injected trailing slash,
// no doubled `#`, and no control characters stripped from query values.
describe('URL shape end-to-end against a real router', () => {
  function makeRouter(initialEntry: string) {
    const rootRoute = createRootRoute({})
    const routes = [
      '/project/$ref/advisors/security',
      '/project/$ref/auth/providers',
      '/project/$ref/logs/explorer',
      '/org',
    ].map((p) => createRoute({ getParentRoute: () => rootRoute, path: p }))
    rootRoute.addChildren(routes)
    return createRouter({
      routeTree: rootRoute,
      history: createMemoryHistory({ initialEntries: [initialEntry] }),
      parseSearch,
      stringifySearch,
    })
  }

  it('produces Next-shaped URLs for every fixed producer', async () => {
    const router = makeRouter(
      '/project/abc/advisors/security?preset=security&filter=a:eq:1&filter=b:eq:2'
    )
    await router.load()
    const build = (opts: LooseNavigateArgs) => router.buildLocation<AnyRouter, string>(opts).href

    // Custom codec: strings and repeated-key arrays, no JSON coercion.
    expect(router.state.location.search).toEqual({
      preset: 'security',
      filter: ['a:eq:1', 'b:eq:2'],
    })

    // Compat router push({ query }) resolves to a ?-only target, split into
    // { to, search }; must stay on the exact current pathname (no
    // `/advisors/security/?...`).
    const target = resolveSearchOrHashOnlyTarget('?preset=WARN', router.state.location.pathname)
    const split = splitInternalUrl(target)
    expect(build({ to: split.to, search: split.search ?? {}, hash: split.hash ?? '' })).toBe(
      '/project/abc/advisors/security?preset=WARN'
    )

    // nuqs write over the whole page query — same guarantee. (The codec
    // percent-encodes `:` as `%3A` — URLSearchParams semantics, matching the
    // compat router's own serialisation — and it re-parses losslessly.)
    const params = new URLSearchParams(router.state.location.searchStr)
    params.set('preset', 'perf')
    const nuqsHref = build({
      ...buildSearchUpdateArgs(router.state.location.pathname, params),
      hash: (h: string | undefined) => h ?? '',
    })
    expect(nuqsHref).toBe(
      '/project/abc/advisors/security?preset=perf&filter=a%3Aeq%3A1&filter=b%3Aeq%3A2'
    )
    expect(parseSearch(nuqsHref.split('?')[1])).toEqual({
      preset: 'perf',
      filter: ['a:eq:1', 'b:eq:2'],
    })

    // nuqs clear-all keeps the exact pathname.
    expect(
      build(buildSearchUpdateArgs(router.state.location.pathname, new URLSearchParams()))
    ).toBe('/project/abc/advisors/security')

    // A bare fragment (the Link shim's hash shape) produces a single '#'.
    expect(build({ to: '/org', hash: 'invoices' })).toBe('/org#invoices')
  })

  // The Logs Explorer regression: query values with newlines. Embedding the
  // query string inside `to` sends it through TanStack's path interpolation
  // (`interpolatePath` → `decodePath` → `sanitizePathSegment`), which
  // percent-decodes and then strips control chars — every `%0A` was deleted,
  // gluing `order by timestamp desc` and `limit 5` into `desclimit 5`.
  const sql = [
    'select',
    '  timestamp,',
    '  event_message',
    'from logs',
    "where source = 'edge_logs'",
    'order by timestamp desc',
    'limit 5',
  ].join('\n')

  it('round-trips newlines in query values through the nuqs producer shape', async () => {
    const router = makeRouter('/project/abc/logs/explorer')
    await router.load()

    // Shape produced by the nuqs adapter's updateUrl: to = current pathname,
    // search = full record.
    const params = new URLSearchParams()
    params.set('s', sql)
    params.set('its', 'PREVIOUS')
    const args = buildSearchUpdateArgs(router.state.location.pathname, params)
    await router.navigate<AnyRouter, string>({
      to: args.to,
      search: args.search,
      hash: (h) => h ?? '',
      replace: true,
    })

    expect(router.state.location.pathname).toBe('/project/abc/logs/explorer')
    expect(router.state.location.search).toEqual({ s: sql, its: 'PREVIOUS' })
    // The href itself keeps the %0A escapes and re-parses losslessly.
    expect(router.state.location.searchStr).toContain('%0A')
    expect(parseSearch(router.state.location.searchStr)).toEqual({ s: sql, its: 'PREVIOUS' })
    expect((router.state.location.search as { s: string }).s).toContain('desc\nlimit 5')
  })

  it('round-trips newlines in query values through the compat router producer shape', async () => {
    const router = makeRouter('/project/abc/logs/explorer')
    await router.load()

    // Shape produced by the compat useRouter().push pipeline:
    // withDefaultPathname → resolveUrl → (toRelativeSameOrigin) →
    // resolveSearchOrHashOnlyTarget → splitInternalUrl → navigate.
    const target = resolveSearchOrHashOnlyTarget(
      resolveUrl(
        withDefaultPathname(
          { query: { ref: 'abc', s: sql, its: 'PREVIOUS' } },
          '/project/[ref]/logs/explorer',
          { ref: 'abc' }
        )
      ),
      router.state.location.pathname
    )
    const { to, search, hash } = splitInternalUrl(target)
    await router.navigate<AnyRouter, string>({
      to,
      search: search ?? {},
      hash: hash ?? '',
    })

    expect(router.state.location.pathname).toBe('/project/abc/logs/explorer')
    expect(router.state.location.search).toEqual({ s: sql, its: 'PREVIOUS' })
    expect((router.state.location.search as { s: string }).s).toContain('desc\nlimit 5')
  })

  it('clears the previous query when the compat producer navigates without one', async () => {
    const router = makeRouter('/project/abc/logs/explorer?s=stale')
    await router.load()

    // Next's push('/path') drops the current query entirely — `search: {}`
    // (not undefined) is what encodes that under TanStack.
    const { to, search, hash } = splitInternalUrl('/project/abc/auth/providers')
    await router.navigate<AnyRouter, string>({
      to,
      search: search ?? {},
      hash: hash ?? '',
    })

    expect(router.state.location.href).toBe('/project/abc/auth/providers')
    expect(router.state.location.search).toEqual({})
  })
})
