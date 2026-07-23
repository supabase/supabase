import { useMemo } from 'react'

import { MULTIGRES_SCHEMA_NAME, resolveHighAvailability } from './useHighAvailability.constants'
import { useSelectedProjectQuery } from './useSelectedProject'

export { MULTIGRES_SCHEMA_NAME, resolveHighAvailability }

export function useHighAvailability() {
  const { data: project, isPending } = useSelectedProjectQuery()

  const isHighAvailability = resolveHighAvailability(project)

  return {
    isHighAvailability,
    isHighAvailabilityDisabled: !isHighAvailability,
    isPending,
  }
}

export function filterSchemasForHighAvailability<T extends { name: string }>(
  schemas: T[],
  isHighAvailability: boolean
) {
  if (!isHighAvailability) return schemas

  return schemas.filter((schema) => schema.name !== MULTIGRES_SCHEMA_NAME)
}

/**
 * Memoized `filterSchemasForHighAvailability` bound to the selected project's
 * high availability state.
 */
export function useSchemasFilteredForHighAvailability<T extends { name: string }>(
  schemas: T[] | undefined
): T[] {
  const { isHighAvailability } = useHighAvailability()

  return useMemo(
    () => filterSchemasForHighAvailability(schemas ?? [], isHighAvailability),
    [schemas, isHighAvailability]
  )
}
