import Fuse from 'fuse.js'
import { sortBy } from 'lodash'

import { SavedDatabaseFunction } from '@/data/database-functions/database-functions-query'

export const getDatabaseTriggersHref = (
  projectRef: string | null | undefined,
  name: string | null | undefined
): string => {
  return `/project/${projectRef ?? ''}/database/triggers?search=${encodeURIComponent(name ?? '')}`
}

export const getFilteredFunctions = ({
  functions,
  filterString,
  returnTypeFilter,
  schema,
  securityFilter,
}: {
  functions: SavedDatabaseFunction[] | undefined
  filterString: string | undefined
  returnTypeFilter: string[] | undefined
  schema: string | undefined
  securityFilter: string[] | undefined
}): SavedDatabaseFunction[] => {
  const filteredFunctions = (functions ?? []).filter((x) => {
    const matchesReturnType =
      returnTypeFilter == null ||
      returnTypeFilter.length === 0 ||
      returnTypeFilter.includes(x.return_type)
    const matchesSecurity =
      securityFilter == null ||
      securityFilter.length === 0 ||
      (securityFilter.includes('definer') && x.security_definer) ||
      (securityFilter.includes('invoker') && !x.security_definer)
    const matchesSchema = schema == null || x.schema == schema
    return matchesReturnType && matchesSecurity && matchesSchema
  })

  if (filterString) {
    // No need to sort like at L93 if filtering is active, fuse will do it by relevance
    const fuse = new Fuse(filteredFunctions, {
      keys: [
        { name: 'name', weight: 2.0 },
        { name: 'definition', weight: 1.0 },
      ],
      threshold: 0.4,
    })
    return fuse.search(filterString).map(({ item }) => item)
  }

  return sortBy(filteredFunctions, (func) => func.name.toLocaleLowerCase())
}
