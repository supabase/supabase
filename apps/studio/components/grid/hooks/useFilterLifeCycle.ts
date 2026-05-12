import { useEffect, useRef } from 'react'

import { filtersToUrlParams, formatFilterURLParams } from '../SupabaseGrid.utils'
import { useTableEditorFiltersSort } from '@/hooks/misc/useTableEditorFiltersSort'
import { useStaticEffectEvent } from '@/hooks/useStaticEffectEvent'
import { useTableEditorTableStateSnapshot } from '@/state/table-editor-table'

/**
 * Hook to initialize filters from URL on mount.
 * This runs once when the component mounts to handle bookmarked/filtered URLs.
 * After initialization, snap.filters is the source of truth.
 */
export function useInitializeFiltersFromUrl() {
  const snap = useTableEditorTableStateSnapshot()
  const { filters: urlFilters } = useTableEditorFiltersSort()

  const initializeFilters = useStaticEffectEvent(() => {
    const parsedFilters = formatFilterURLParams(urlFilters)
    if (parsedFilters.length > 0) {
      snap.setFilters(parsedFilters)
    }
  })

  useEffect(() => {
    initializeFilters()
  }, [initializeFilters])
}

/**
 * Hook to sync filters from snap state to URL params.
 * This is a one-way sync: snap state → URL (for bookmarking/sharing).
 * Debounced by 500ms to avoid excessive URL updates.
 */
export function useSyncFiltersToUrl() {
  const snap = useTableEditorTableStateSnapshot()
  const { setParams } = useTableEditorFiltersSort()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previousFiltersRef = useRef<string>('')

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

    // Debounce URL updates by 500ms
    timeoutRef.current = setTimeout(() => {
      const completeFilters = snap.filters.filter((filter) => {
        const value = filter.value
        return value !== '' && value !== null && value !== undefined
      })

      // Convert filters to URL format
      const urlFilters = filtersToUrlParams(completeFilters)

      // Update URL params
      setParams((prev) => ({
        ...prev,
        filter: urlFilters,
      }))
    }, 500)

    // Cleanup on unmount or filter change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [snap.filters, setParams])
}
