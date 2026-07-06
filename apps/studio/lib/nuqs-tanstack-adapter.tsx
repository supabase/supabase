import { useLocation, useNavigate } from '@tanstack/react-router'
import { renderQueryString, unstable_createAdapterProvider } from 'nuqs/adapters/custom'
import { startTransition, useCallback, useMemo } from 'react'

// Custom nuqs adapter for TanStack Router.
//
// The stock `nuqs/adapters/tanstack-router` adapter navigates with
// `navigate({ to: renderQueryString(search) || '.', from })`. TanStack
// resolves a `?`-only relative `to` by *appending* it to the current path,
// injecting a trailing slash — every nuqs write turned
// `/auth/providers?provider=x` into `/auth/providers/?provider=x`. We build
// an absolute target from the current pathname instead. Everything else
// (searchParams derivation, replace/push, scroll, hash preservation)
// mirrors the stock adapter's contract.

type AdapterOptions = { history: 'push' | 'replace'; scroll: boolean; shallow: boolean }

// Compose the current pathname and a nuqs-rendered query string (`?...` or
// '' when every param is cleared) into an absolute navigation target.
// `pathname` comes from TanStack's parsed location, which is already
// basepath-stripped; guard against a trailing slash anyway (root stays `/`).
// Exported for unit tests — not part of the adapter surface.
export function buildSearchUpdateTarget(pathname: string, queryString: string): string {
  let base = pathname || '/'
  if (base.length > 1 && base.endsWith('/')) base = base.slice(0, -1)
  return `${base}${queryString}`
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
      startTransition(() => {
        navigate({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          to: buildSearchUpdateTarget(pathname, renderQueryString(search)) as any,
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
