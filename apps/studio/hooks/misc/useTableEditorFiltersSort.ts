import { useLocation, useRouter, type AnyRouter } from '@tanstack/react-router'
import { isEqual } from 'lodash'
import { useCallback, useEffect, useMemo } from 'react'

import { useLatest } from './useLatest'
import { parseSearch, type SearchRecord } from '@/lib/router-search-params'

// Filter and sort pushes come from separate hook instances but write the same URL, and the router
// only reflects a push once it settles. Until then, a later push merges onto the in-flight search
// instead of the stale location. It only applies while the router still shows the URL it was built
// from, so a settled push or a Back/Forward makes it obsolete.
let inFlightPush: { fromHref: string; search: SearchRecord } | null = null

const toParamArray = (value: string | string[] | undefined) =>
  value === undefined ? [] : ([] as string[]).concat(value)

export const useTableEditorFiltersSort = () => {
  const router = useRouter()
  const location = useLocation()
  // setParams runs from handlers and timers, possibly long after the render it was created in.
  const latestLocation = useLatest(location)

  const path = location.pathname

  // Back/Forward supersedes any in-flight push, even if it lands on the URL that push started from.
  useEffect(() => {
    const clearInFlightPush = () => {
      inFlightPush = null
    }
    window.addEventListener('popstate', clearInFlightPush)
    return () => window.removeEventListener('popstate', clearInFlightPush)
  }, [])

  const urlParams = useMemo(() => {
    return new URLSearchParams(location.searchStr)
  }, [location.searchStr])

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
      const currentLocation = latestLocation.current
      const pending = inFlightPush?.fromHref === currentLocation.href ? inFlightPush : null
      const baseSearch = pending?.search ?? parseSearch(currentLocation.searchStr)
      const prevParams = {
        filter: toParamArray(baseSearch.filter),
        sort: toParamArray(baseSearch.sort),
      }
      const newParams = fn(prevParams)

      const hasFilter = newParams.filter !== undefined
      const hasSort = newParams.sort !== undefined
      // Compare to the search this push would build on (the in-flight edit, or the URL). A no-op
      // sync must not create an entry that discards browser Forward history.
      const areFiltersUnchanged = !hasFilter || isEqual(newParams.filter, prevParams.filter)
      const areSortsUnchanged = !hasSort || isEqual(newParams.sort, prevParams.sort)
      if (areFiltersUnchanged && areSortsUnchanged) return

      const nextSearch: SearchRecord = { ...baseSearch }
      if (hasFilter) {
        if (newParams.filter!.length > 0) nextSearch.filter = newParams.filter!
        else delete nextSearch.filter
      }
      if (hasSort) {
        if (newParams.sort!.length > 0) nextSearch.sort = newParams.sort!
        else delete nextSearch.sort
      }

      const push = { fromHref: currentLocation.href, search: nextSearch }
      inFlightPush = push
      void router
        .navigate<AnyRouter, string>({
          to: currentLocation.pathname,
          search: nextSearch,
          hash: currentLocation.hash,
        })
        .finally(() => {
          if (inFlightPush === push) inFlightPush = null
        })
    },
    [latestLocation, router]
  )

  return {
    path,
    filters,
    sorts,
    setParams,
  }
}
