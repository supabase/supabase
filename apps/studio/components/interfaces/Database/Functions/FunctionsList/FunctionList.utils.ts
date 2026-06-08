import Fuse from 'fuse.js'
import { useMemo } from 'react'

import { DatabaseFunction } from '@/data/database-functions/database-functions-query'

export const getDatabaseTriggersHref = (
  projectRef: string | null | undefined,
  name: string | null | undefined
): string => {
  return `/project/${projectRef ?? ''}/database/triggers?search=${encodeURIComponent(name ?? '')}`
}

export const useFilteredFunctions = ({
  functions,
  filterString,
  returnTypeFilter,
  securityFilter,
  schema,
}: {
  functions: DatabaseFunction[] | undefined
  filterString: string
  returnTypeFilter: string[] | undefined | null
  securityFilter: string[] | undefined | null
  schema: string | undefined
}) => {
  const filteredFunctions = useMemo(
    () =>
      (functions ?? []).filter((x) => {
        const matchesReturnType =
          returnTypeFilter == null ||
          returnTypeFilter.length === 0 ||
          returnTypeFilter.includes(x.return_type)
        const matchesSecurity =
          securityFilter == null ||
          securityFilter.length === 0 ||
          (securityFilter.includes('definer') && x.security_definer) ||
          (securityFilter.includes('invoker') && !x.security_definer)
        return matchesReturnType && matchesSecurity && x.schema === schema
      }),
    [functions, returnTypeFilter, securityFilter, schema]
  )

  const fuse = useMemo(() => {
    return new Fuse(filteredFunctions ?? [], {
      keys: ['name', 'definition'],
      threshold: 0.4,
    })
  }, [filteredFunctions])

  if (filterString) {
    return fuse.search(filterString).map(({ item }) => item)
  }

  return filteredFunctions
}
