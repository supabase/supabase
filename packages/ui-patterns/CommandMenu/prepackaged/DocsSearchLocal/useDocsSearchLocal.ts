'use client'

import type { SupabaseClient } from '@supabase/auth-helpers-react'
import { debounce } from 'lodash'
import { useCallback, useMemo } from 'react'

import { useLocalSearch } from './DocsSearchLocal.client'

export function useDocsSearchLocal(supabase: SupabaseClient) {
  const { search, searchState, reset } = useLocalSearch(supabase)

  const handleSearch = useCallback(
    (query: string) => {
      const trimmedQuery = query.trim()
      return trimmedQuery ? search(trimmedQuery) : reset()
    },
    [search]
  )

  const debouncedSearch = useMemo(() => debounce(handleSearch, 100), [handleSearch])

  return {
    searchState,
    handleSearch,
    debouncedSearch,
    reset,
  }
}
