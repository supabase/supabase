'use client'

import { useSearchParamsShallow } from 'common'
import { xor } from 'lodash-es'
import { useCallback, useEffect, useMemo, useRef } from 'react'

const LOCAL_STORAGE_KEY = 'supabase.ui-patterns.ComplexTabs.withQueryParams.v0'

export interface UseTabsWithQueryParamsOptions {
  tabIds: string[]
  queryGroup?: string
}

/**
 * Wraps the basic `Tabs` component from the `ui` library so it stores
 * selection state in query params.
 */
export const useTabsWithQueryParams = ({ tabIds, queryGroup }: UseTabsWithQueryParamsOptions) => {
  // Store in ref to avoid stale data in later timeout
  const tabIdsRef = useRef(tabIds)
  tabIdsRef.current = tabIds

  // Store in ref to avoid stale data in later timeout
  const queryGroupRef = useRef(queryGroup)
  queryGroupRef.current = queryGroup

  const searchParams = useSearchParamsShallow()
  const queryTabMaybe = queryGroupRef.current && searchParams.get(queryGroupRef.current)
  const queryTab =
    queryTabMaybe && tabIdsRef.current.includes(queryTabMaybe) ? queryTabMaybe : undefined

  const onTabSelected = useCallback(
    (id: string) => {
      if (queryGroupRef.current) {
        if (!searchParams.getAll('queryGroups').includes(queryGroupRef.current)) {
          searchParams.append('queryGroups', queryGroupRef.current)
        }
        searchParams.set(queryGroupRef.current, id)
      }
    },
    [searchParams]
  )

  const checkedLocalStorage = useRef(false)
  useEffect(() => {
    let timeout: number | undefined
    if (!checkedLocalStorage.current) {
      // Timeout to avoid something (I think the router) overwriting it
      timeout = window.setTimeout(() => {
        if (
          queryGroupRef.current &&
          !new URLSearchParams(window.location.search).has(queryGroupRef.current)
        ) {
          try {
            const storedValues = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) ?? '')
            if (storedValues === null || typeof storedValues !== 'object') return

            let storedValue: any = null
            let maxDiff = tabIdsRef.current.length
            Object.entries(storedValues).forEach(([key, value]) => {
              const arr = key.split(',')
              const diff = xor(arr, tabIdsRef.current)
              if (diff.length < maxDiff) {
                maxDiff = diff.length
                storedValue = value
              }
            })

            if (storedValue && tabIdsRef.current.includes(storedValue)) {
              onTabSelected(storedValue)
            }
          } catch {
            // ignore
          }
        }
      }, 300)

      checkedLocalStorage.current = true
    }

    if (queryGroupRef.current && queryTab) {
      let updatedValues: Record<string, unknown> = {}
      try {
        const oldValues = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) ?? '')
        if (oldValues && typeof oldValues === 'object') {
          updatedValues = oldValues
        }
      } catch {
        // ignore
      }

      updatedValues[tabIdsRef.current.sort().join(',')] = queryTab

      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedValues))
      } catch {
        // ignore
      }
    }
  }, [queryTab, onTabSelected])

  return useMemo(() => ({ queryTab, onTabSelected }), [queryTab, onTabSelected])
}
