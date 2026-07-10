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
