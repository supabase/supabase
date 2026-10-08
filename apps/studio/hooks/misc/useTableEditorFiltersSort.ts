import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

import { useLatest } from './useLatest'

// Filter and sort pushes come from separate hook instances but write the same URL, and the router
// only reflects a push once it settles. Until then, a later push merges onto the in-flight query
// instead of the stale `router.query`. It only applies while the router still shows the URL it was
// built from, so a settled push or a Back/Forward makes it obsolete.
let inFlightPush: { fromAsPath: string; query: ReturnType<typeof useRouter>['query'] } | null = null

const toParamArray = (value: string | string[] | undefined) =>
  value === undefined ? [] : ([] as string[]).concat(value)

type Router = ReturnType<typeof useRouter>

/**
 * The router's current query, with search params read from `asPath`. Under TanStack the compat
 * router's `asPath` updates a render before its `query`, so `query` alone can be stale. Route
 * params (the bracketed segments of the route pattern, e.g. `ref`, `id`) still come from `query`.
 */
const getCurrentQuery = (router: Router): Router['query'] => {
  const search = new URLSearchParams(router.asPath.split('#')[0].split('?')[1] ?? '')
  const query: Router['query'] = {}
  for (const key of new Set(search.keys())) {
    const values = search.getAll(key)
    query[key] = values.length === 1 ? values[0] : values
  }
  for (const [, name] of router.pathname.matchAll(/\[{1,2}(?:\.\.\.)?([^\]]+)\]{1,2}/g)) {
    if (router.query[name] !== undefined) query[name] = router.query[name]
  }
  return query
}

export const useTableEditorFiltersSort = () => {
  const router = useRouter()
  // setParams runs from handlers and timers, possibly long after the render it was created in.
  const latestRouter = useLatest(router)

  const path = router.asPath.split(/[?#]/)[0]

  const urlParams = useMemo(() => {
    return new URLSearchParams(router.asPath.split('?')[1])
  }, [router.asPath])

  const filters = useMemo(() => {
    return urlParams.getAll('filter')
  }, [urlParams])

  const sorts = useMemo(() => {
    return urlParams.getAll('sort')
  }, [urlParams])

  type SetParamsArgs = {
    filter?: string[]
    sort?: string[]
  }

  const setParams = useCallback(
    (fn: (prevParams: SetParamsArgs) => SetParamsArgs) => {
      const router = latestRouter.current
      const pending = inFlightPush?.fromAsPath === router.asPath ? inFlightPush : null
      const baseQuery = pending?.query ?? getCurrentQuery(router)
      const prevParams = {
        filter: toParamArray(baseQuery.filter),
        sort: toParamArray(baseQuery.sort),
      }
      const newParams = fn(prevParams)

      const hasFilter = newParams.filter !== undefined
      const hasSort = newParams.sort !== undefined

      const query = {
        ...baseQuery,
        ...(hasFilter ? { filter: newParams.filter } : {}),
        ...(hasSort ? { sort: newParams.sort } : {}),
      }
      const push = { fromAsPath: router.asPath, query }
      inFlightPush = push
      void router.push({ query }, undefined, { shallow: true }).finally(() => {
        if (inFlightPush === push) inFlightPush = null
      })
    },
    [latestRouter]
  )

  return {
    path,
    filters,
    sorts,
    setParams,
  }
}
