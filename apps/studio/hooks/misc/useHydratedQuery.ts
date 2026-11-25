import { useHydrated, useSearch } from '@tanstack/react-router'

import type { SearchRecord } from '@/lib/router-search-params'

/**
 * Query params for use during render. Empty until hydration, since one prerendered file serves
 * every query string and the first client render has to match it.
 */
export function useHydratedQuery(): SearchRecord {
  const search = useSearch({ strict: false }) as SearchRecord
  return useHydrated() ? search : {}
}
