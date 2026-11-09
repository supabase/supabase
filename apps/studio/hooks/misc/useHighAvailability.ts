import { useMemo } from 'react'

import { MULTIGRES_SCHEMA_NAME, resolveHighAvailability } from './useHighAvailability.constants'
import {
  useIsHighAvailability,
  useProjectCapabilities,
  useSelectedProjectQuery,
} from './useSelectedProject'

export { MULTIGRES_SCHEMA_NAME, resolveHighAvailability }

export function useHighAvailability() {
  const isHighAvailability = useIsHighAvailability()
  const { isPending } = useSelectedProjectQuery()

  return {
    isHighAvailability,
    isHighAvailabilityDisabled: !isHighAvailability,
    isPending,
  }
}

/**
 * `shouldHideMultigresSchema` is whether this project runs on the Multigres
 * stack (full Multigres or Multigres Lite) and therefore has the internal
 * `multigres` schema to hide — not whether it's specifically HA. See
 * `useSchemasFilteredForHighAvailability` below for how that's derived.
 */
export function filterSchemasForHighAvailability<T extends { name: string }>(
  schemas: T[],
  shouldHideMultigresSchema: boolean
) {
  if (!shouldHideMultigresSchema) return schemas

  return schemas.filter((schema) => schema.name !== MULTIGRES_SCHEMA_NAME)
}

/**
 * Memoized `filterSchemasForHighAvailability` bound to the selected project's
 * capabilities. Driven by `hasConnectionPooling` (false for both full
 * Multigres and Multigres Lite) rather than `isHighAvailability`, since Lite
 * also has the internal `multigres` schema despite not being HA.
 */
export function useSchemasFilteredForHighAvailability<T extends { name: string }>(
  schemas: T[] | undefined
): T[] {
  const capabilities = useProjectCapabilities()
  const shouldHideMultigresSchema = capabilities?.hasConnectionPooling === false

  return useMemo(
    () => filterSchemasForHighAvailability(schemas ?? [], shouldHideMultigresSchema),
    [schemas, shouldHideMultigresSchema]
  )
}
