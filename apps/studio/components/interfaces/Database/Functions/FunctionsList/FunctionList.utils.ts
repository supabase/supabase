import { includes, sortBy } from 'lodash'

import { DatabaseFunction } from '@/data/database-functions/database-functions-query'

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
  securityFilter,
  schema,
}: {
  functions: DatabaseFunction[] | undefined
  filterString: string
  returnTypeFilter: string[]
  securityFilter: string[]
  schema: string | undefined
}): DatabaseFunction[] => {
  const filteredFunctions: (DatabaseFunction & { rank: number })[] = []

  ;(functions ?? []).forEach((x) => {
    const matchesName = includes(x.name.toLowerCase(), filterString.toLowerCase())
    const matchesContent = includes(x.complete_statement.toLowerCase(), filterString.toLowerCase())
    const matchesReturnType =
      returnTypeFilter.length === 0 || returnTypeFilter.includes(x.return_type)
    const matchesSecurity =
      securityFilter.length === 0 ||
      (securityFilter.includes('definer') && x.security_definer) ||
      (securityFilter.includes('invoker') && !x.security_definer)

    if (
      (matchesName || matchesContent) &&
      matchesReturnType &&
      matchesSecurity &&
      x.schema === schema
    ) {
      filteredFunctions.push({ ...x, rank: matchesName ? 0 : 1 })
    }
  })

  // Sort by rank (name match first, then content match) and then by name
  const sortedFunctions = sortBy(
    filteredFunctions,
    (func) => func.rank,
    (func) => func.name.toLocaleLowerCase()
  )
  return sortedFunctions
}
