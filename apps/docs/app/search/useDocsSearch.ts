'use client'

import { debounce } from 'lodash'
import { useCallback, useMemo } from 'react'
import { useLocalSearch } from '~/features/local-search/local-search.client'

export function useDocsSearch() {
  const { search, searchResults } = useLocalSearch()

  const handleSearch = useCallback(
    (query: string) => {
      search(query.trim())
    },
    [search]
  )

  const debouncedSearch = useMemo(() => debounce(handleSearch, 100), [handleSearch])

  return {
    searchResults,
    handleDocsSearch: handleSearch,
    handleDocsSearchDebounced: debouncedSearch,
  }
}
