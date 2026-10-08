import { useEffect, useEffectEvent, useRef } from 'react'

import { filtersToUrlParams, formatFilterURLParams } from '../SupabaseGrid.utils'
import type { Filter } from '../types'
import { useTableEditorFiltersSort } from '@/hooks/misc/useTableEditorFiltersSort'
import { useTableEditorTableStateSnapshot } from '@/state/table-editor-table'

const getUrlTableId = (path: string) => path.match(/\/editor\/(\d+)\/?$/)?.[1]

const toUrlFilters = (filters: readonly Filter[]) =>
  filtersToUrlParams(
    filters.filter(({ value }) => value !== '' && value !== null && value !== undefined)
  )

/**
 * Hook to initialize filters from URL on mount.
 * This runs once when the component mounts to handle bookmarked/filtered URLs.
 * After initialization, snap.filters is the source of truth.
 */
export function useInitializeFiltersFromUrl() {
  const snap = useTableEditorTableStateSnapshot()
  const { filters: urlFilters } = useTableEditorFiltersSort()

  const initializeFilters = useEffectEvent(() => {
    const parsedFilters = formatFilterURLParams(urlFilters)
    if (parsedFilters.length > 0) {
      snap.setFilters(parsedFilters)
    }
  })

  useEffect(() => {
    initializeFilters()
  }, [])
}

/**
 * Hook to keep filters in snap state and URL params in sync.
 * snap state → URL is debounced by 500ms to avoid excessive URL updates.
 * URL → snap state covers URL changes that don't remount the grid (e.g. Back/Forward within the
 * same table). The URL wins over a pending state → URL update since it reflects the user's latest
 * navigation: a filter applied less than 500ms before Back/Forward is intentionally discarded rather
 * than pushed over the entry the user navigated to.
 */
export function useSyncFiltersToUrl() {
  const snap = useTableEditorTableStateSnapshot()
  const { path, filters: urlFilters, sorts: urlSorts, setParams } = useTableEditorFiltersSort()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previousFiltersRef = useRef<string>('')
  const isHistoryNavigationRef = useRef(false)

  const urlFiltersKey = JSON.stringify(urlFilters)
  const urlSortsKey = JSON.stringify(urlSorts)
  // Under TanStack the URL moves to the next table before this grid unmounts.
  const isOwnTableUrl = getUrlTableId(path) === String(snap.originalTable.id)
  const lastUrlFiltersKeyRef = useRef(urlFiltersKey)
  const pushedUrlFiltersKeyRef = useRef<string | null>(null)

  // Back/Forward cancels a pending push outright: other URL changes (e.g. a sort) must not drop
  // an in-flight filter edit, but history navigation must never push over its destination.
  useEffect(() => {
    const handlePopState = () => {
      isHistoryNavigationRef.current = true
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const syncFiltersFromUrl = useEffectEvent(() => {
    if (!isOwnTableUrl) return
    // After Back/Forward, re-adopt the URL's filters even if the `filter` param didn't change,
    // since an unpushed edit was discarded with its pending push.
    const isHistoryNavigation = isHistoryNavigationRef.current
    isHistoryNavigationRef.current = false
    if (!isHistoryNavigation && urlFiltersKey === lastUrlFiltersKeyRef.current) return
    lastUrlFiltersKeyRef.current = urlFiltersKey

    // Our own debounced push arriving, or a URL that already matches state
    const isOwnPush = !isHistoryNavigation && urlFiltersKey === pushedUrlFiltersKeyRef.current
    pushedUrlFiltersKeyRef.current = null
    if (isOwnPush || urlFiltersKey === JSON.stringify(toUrlFilters(snap.filters))) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    snap.setFilters(formatFilterURLParams(urlFilters))
  })

  useEffect(() => {
    syncFiltersFromUrl()
  }, [urlFiltersKey, urlSortsKey, isOwnTableUrl])

  // An Effect Event so URL changes (new `setParams`) don't cancel a pending push.
  const pushFiltersToUrl = useEffectEvent((filter: string[]) => {
    setParams((prev) => ({ ...prev, filter }))
  })

  useEffect(() => {
    // Serialize filters for comparison
    const currentFiltersStr = JSON.stringify(snap.filters)

    // Only proceed if filters have actually changed
    if (currentFiltersStr === previousFiltersRef.current) {
      return
    }

    previousFiltersRef.current = currentFiltersStr

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // The URL already reflects these filters (e.g. they were just read from it)
    const nextUrlFilters = toUrlFilters(snap.filters)
    const nextUrlFiltersKey = JSON.stringify(nextUrlFilters)
    if (nextUrlFiltersKey === lastUrlFiltersKeyRef.current) return

    // Debounce URL updates by 500ms
    timeoutRef.current = setTimeout(() => {
      pushedUrlFiltersKeyRef.current = nextUrlFiltersKey
      pushFiltersToUrl(nextUrlFilters)
    }, 500)

    // Cleanup on unmount or filter change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [snap.filters])
}
