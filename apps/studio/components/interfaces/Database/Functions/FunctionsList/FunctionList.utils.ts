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
        const matchesSchema = schema == null || x.schema === schema
        return matchesReturnType && matchesSecurity && matchesSchema
      }),
    [functions, returnTypeFilter, securityFilter, schema]
  )

  const fuse = useMemo(() => {
    return new Fuse(filteredFunctions ?? [], {
      keys: [
        { name: 'name', weight: 2.0 },
        { name: 'definition', weight: 1.0 },
      ],
      threshold: 0.4,
    })
  }, [filteredFunctions])

  if (filterString) {
    return fuse.search(filterString).map(({ item }) => item)
  }

  return filteredFunctions
}
