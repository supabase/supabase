import { useCallback } from 'react'

import { filtersToUrlParams, formatFilterURLParams } from 'components/grid/SupabaseGrid.utils'
import type { Filter } from 'components/grid/types'
import { useTableEditorFiltersSort } from 'hooks/misc/useTableEditorFiltersSort'

/**
 * Hook for managing table filter URL parameters and saving.
 * NO direct snapshot interaction.
 */
export function useTableFilter() {
  const { filters: urlFilters, setParams } = useTableEditorFiltersSort()

  const filters = formatFilterURLParams(urlFilters)

  const onApplyFilters = useCallback(
    (appliedFilters: Filter[]) => {
      const newUrlFilters = filtersToUrlParams(appliedFilters)
      setParams((prevParams) => ({ ...prevParams, filter: newUrlFilters }))
    },
    [setParams]
  )

  return {
    filters, // Formatted Filter[] object array
    urlFilters, // Raw string[] from URL
    onApplyFilters, // Callback to apply changes
  }
}
