import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

// Filter and sort pushes come from separate hook instances but write the same URL, and the router
// only reflects a push once it settles. Until then, a later push merges onto the in-flight query
// instead of the stale `router.query`. It only applies while the router still shows the URL it was
// built from, so a settled push or a Back/Forward makes it obsolete.
let inFlightPush: { fromAsPath: string; query: ReturnType<typeof useRouter>['query'] } | null = null

const toParamArray = (value: string | string[] | undefined) =>
  value === undefined ? [] : ([] as string[]).concat(value)

export const useTableEditorFiltersSort = () => {
  const router = useRouter()

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
      const pending = inFlightPush?.fromAsPath === router.asPath ? inFlightPush : null
      const baseQuery = pending?.query ?? router.query
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters, sorts]
  )

  return {
    path,
    filters,
    sorts,
    setParams,
  }
}
