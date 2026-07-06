import { useLocation, useNavigate } from '@tanstack/react-router'
import { unstable_createAdapterProvider } from 'nuqs/adapters/custom'
import { startTransition, useCallback, useMemo } from 'react'

import { searchParamsToRecord, type SearchRecord } from './router-search-params'

// Custom nuqs adapter for TanStack Router.
//
// The stock `nuqs/adapters/tanstack-router` adapter navigates with
// `navigate({ to: renderQueryString(search) || '.', from })`. That shape is
// doubly broken for us:
//   - TanStack resolves a `?`-only relative `to` by *appending* it to the
//     current path, injecting a trailing slash — every nuqs write turned
//     `/auth/providers?provider=x` into `/auth/providers/?provider=x`.
//   - Embedding the query string in `to` at all sends it through TanStack's
//     path interpolation, which percent-decodes and then strips control
//     characters — `%0A` newlines in values (e.g. Logs Explorer SQL in `s`)
//     were silently deleted.
// So we navigate with `to` = the current pathname and the query as a
// TanStack `search` *object*, which the router serialises through the app's
// Next-style codec (lib/router-search-params) without touching the path
// pipeline. Everything else (searchParams derivation, replace/push, scroll,
// hash preservation) mirrors the stock adapter's contract.

type AdapterOptions = { history: 'push' | 'replace'; scroll: boolean; shallow: boolean }

// Compose the nuqs-updated URLSearchParams into TanStack navigate args:
// `to` is the current pathname (from TanStack's parsed location, already
// basepath-stripped; guard against a trailing slash anyway — root stays `/`)
// and `search` is the FULL desired search state as a record ({} correctly
// clears every param). Exported for unit tests — not part of the adapter
// surface.
export function buildSearchUpdateArgs(
  pathname: string,
  search: URLSearchParams
): { to: string; search: SearchRecord } {
  let to = pathname || '/'
  if (to.length > 1 && to.endsWith('/')) to = to.slice(0, -1)
  return { to, search: searchParamsToRecord(search) }
}

function useNuqsTanStackRouterAdapter(watchKeys: string[]) {
  const search = useLocation({
    select: (state) =>
      Object.fromEntries(Object.entries(state.search).filter(([key]) => watchKeys.includes(key))),
  })
  const pathname = useLocation({ select: (state) => state.pathname })
  const navigate = useNavigate()

  const searchParams = useMemo(
    () =>
      new URLSearchParams(
        Object.entries(search).flatMap(([key, value]): Array<[string, string]> => {
          if (Array.isArray(value)) return value.map((v) => [key, String(v)])
          if (typeof value === 'object' && value !== null) return [[key, JSON.stringify(value)]]
          return [[key, String(value)]]
        })
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [search, watchKeys.join(',')]
  )

  const updateUrl = useCallback(
    (search: URLSearchParams, options: AdapterOptions) => {
      const args = buildSearchUpdateArgs(pathname, search)
      startTransition(() => {
        navigate({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          to: args.to as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          search: args.search as any,
          replace: options.history === 'replace',
          resetScroll: options.scroll,
          // Keep the current hash — nuqs updates must not clear `#section`.
          hash: (prevHash) => prevHash ?? '',
        })
      })
    },
    [navigate, pathname]
  )

  return {
    searchParams,
    updateUrl,
    rateLimitFactor: 1,
  }
}

export const NuqsAdapter = unstable_createAdapterProvider(useNuqsTanStackRouterAdapter)
